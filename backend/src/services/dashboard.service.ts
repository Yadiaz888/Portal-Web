import { prisma } from '../lib/prisma.js';
import { getActivityLogs } from './activityLog.service.js';

const COMPLETED_STATUSES = ['COMPLETED', 'PAID'];
const REJECTED_STATUSES = ['REJECTED', 'CANCELLED'];

const STATUS_PROGRESS: Record<string, number> = {
  PENDING: 25,
  APPROVED_MANAGER: 50,
  APPROVED_ACCOUNTANT: 75,
  COMPLETED: 90,
  PAID: 100,
  REJECTED: 100,
  CANCELLED: 100,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Enviado a aprobación',
  APPROVED_MANAGER: 'Aprobado por jefe',
  APPROVED_ACCOUNTANT: 'Aprobado por contabilidad',
  COMPLETED: 'Completado',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Solicitud creada',
  APPROVE_MANAGER: 'Aprobación de jefe',
  APPROVE_ACCOUNTANT: 'Aprobación de contabilidad',
  COMPLETE: 'Solicitud completada',
  PAY: 'Pago registrado',
  REJECT: 'Solicitud rechazada',
  CANCEL: 'Solicitud cancelada',
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ENTITIES = ['Anticipo', 'Factura', 'Viatico', 'Legalizacion'] as const;

type RequestEntity = typeof ENTITIES[number];
type RequestSummary = {
  id: number;
  entity: RequestEntity;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
};

async function getRequestsByEntity(entity: RequestEntity, userId?: number): Promise<RequestSummary[]> {
  const select = {
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    description: true,
  };

  const where = { ...(userId ? { createdById: userId } : {}), deletedAt: null };
  const rows = entity === 'Anticipo'
    ? await prisma.anticipo.findMany({ where, select })
    : entity === 'Factura'
      ? await prisma.factura.findMany({ where, select })
      : entity === 'Viatico'
        ? await prisma.viatico.findMany({ where, select })
        : await prisma.legalizacion.findMany({ where, select });

  return rows.map((row) => ({ ...row, entity }));
}

function getRequestNumber(entity: string, id?: number | null) {
  return id ? `${entity} No. ${id}` : entity;
}

function getActivityText(action: string, entity: string, entityId?: number | null, toState?: string) {
  const requestNumber = getRequestNumber(entity, entityId);

  if (action === 'CREATE') return `Se creó ${requestNumber}`;
  if (action === 'APPROVE_MANAGER') return `Se aprobó por jefe ${requestNumber}`;
  if (action === 'APPROVE_ACCOUNTANT') return `Se aprobó por contabilidad ${requestNumber}`;
  if (action === 'COMPLETE') return `Se completó ${requestNumber}`;
  if (action === 'PAY') return `Se registró el pago de ${requestNumber}`;
  if (action === 'REJECT') return `Se rechazó ${requestNumber}`;
  if (action === 'CANCEL') return `Se canceló ${requestNumber}`;
  if (action.startsWith('STATUS_CHANGE_')) {
    return `Cambio de estado de ${requestNumber} a ${STATUS_LABELS[toState ?? ''] ?? toState ?? 'nuevo estado'}`;
  }

  return `${ACTION_LABELS[action] ?? action} en ${requestNumber}`;
}

function getProgressFromActivity(action: string, details?: string | null) {
  let toState: string | undefined;

  if (details) {
    try {
      const parsed = JSON.parse(details) as { toState?: string };
      toState = parsed.toState;
    } catch {
      toState = undefined;
    }
  }

  if (!toState && action.startsWith('STATUS_CHANGE_')) {
    toState = action.replace('STATUS_CHANGE_', '');
  }

  return {
    toState,
    percent: STATUS_PROGRESS[toState ?? ''] ?? (action === 'CREATE' ? STATUS_PROGRESS.PENDING : 0),
  };
}

function getLastMonths(count = 7) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: MONTH_LABELS[date.getMonth()],
    };
  });
}

export const dashboardService = {
  async getHome(userId: number, roleName?: string) {
    const isAdmin = roleName === 'ADMIN';
    const filterUserId = isAdmin ? undefined : userId;

    const requests = (await Promise.all(ENTITIES.map((entity) => getRequestsByEntity(entity, filterUserId)))).flat();
    const total = requests.length;
    const approved = requests.filter((request) => COMPLETED_STATUSES.includes(request.status)).length;
    const rejected = requests.filter((request) => REJECTED_STATUSES.includes(request.status)).length;

    const months = getLastMonths();
    const monthMap = new Map(months.map((month) => [month.key, {
      mes: month.label,
      Solicitudes: 0,
      Aprobaciones: 0,
    }]));

    for (const request of requests) {
      const createdKey = `${request.createdAt.getFullYear()}-${String(request.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const updatedKey = `${request.updatedAt.getFullYear()}-${String(request.updatedAt.getMonth() + 1).padStart(2, '0')}`;

      const createdBucket = monthMap.get(createdKey);
      if (createdBucket) createdBucket.Solicitudes += 1;

      if (COMPLETED_STATUSES.includes(request.status)) {
        const approvedBucket = monthMap.get(updatedKey);
        if (approvedBucket) approvedBucket.Aprobaciones += 1;
      }
    }

    const activities = await getActivityLogs({ userId: filterUserId, limit: 20 });

    return {
      stats: {
        total,
        approved,
        rejected,
      },
      chartData: Array.from(monthMap.values()),
      myRequests: requests
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((request) => ({
          id: request.id,
          entity: request.entity,
          number: `${request.entity} No. ${request.id}`,
          description: request.description ?? 'Sin descripcion',
          status: request.status,
          statusLabel: STATUS_LABELS[request.status] ?? request.status,
          progress: STATUS_PROGRESS[request.status] ?? 0,
          createdAt: request.createdAt,
          detailPath: request.entity === 'Anticipo'
            ? `/gestor-anticipos/${request.id}`
            : request.entity === 'Factura'
              ? '/registro-gastos'
              : request.entity === 'Legalizacion'
                ? `/legalizacion-viaticos/${request.id}?mode=view`
                : '/legalizacion-viaticos',
        })),
      activities: activities.map((activity) => {
        const progress = getProgressFromActivity(activity.action, activity.details);
        return {
          id: activity.id,
          label: ACTION_LABELS[activity.action] ?? STATUS_LABELS[progress.toState ?? ''] ?? activity.action,
          text: getActivityText(activity.action, activity.entity, activity.entityId, progress.toState),
          percent: progress.percent,
          timestamp: activity.timestamp,
        };
      }),
    };
  },
};
