import { prisma } from '../lib/prisma.js';
import { getActivityLogs } from './activityLog.service.js';

const COMPLETED_STATUSES = ['COMPLETED', 'PAID', 'LIQUIDADO'];
const REJECTED_STATUSES = ['REJECTED', 'CANCELLED', 'RECHAZADO'];

const STATUS_PROGRESS: Record<string, number> = {
  // Anticipo / Factura / Viatico
  PENDING: 25,
  APPROVED_MANAGER: 50,
  APPROVED_ACCOUNTANT: 75,
  COMPLETED: 90,
  PAID: 100,
  REJECTED: 100,
  CANCELLED: 100,
  // Gasto
  CREADO: 15,
  ENVIADO_A_JEFE: 40,
  ENVIADO_A_CONTABILIDAD: 70,
  LIQUIDADO: 100,
  RECHAZADO: 100,
};

const ACTION_PROGRESS: Record<string, number> = {
  CREATE: 15,
  UPDATE: 15,
  DELETE: 0,
  SEND_TO_MANAGER: 40,
  APPROVE_MANAGER: 50,
  SEND_TO_ACCOUNTANT: 70,
  APPROVE_ACCOUNTANT: 75,
  COMPLETE: 90,
  PAY: 100,
  LIQUIDATE: 100,
  REJECT: 100,
  CANCEL: 100,
};

const STATUS_LABELS: Record<string, string> = {
  // Anticipo / Factura / Viatico
  PENDING: 'Enviado a aprobación',
  APPROVED_MANAGER: 'Aprobado por jefe',
  APPROVED_ACCOUNTANT: 'Aprobado por contabilidad',
  COMPLETED: 'Completado',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  // Gasto
  CREADO: 'Creado',
  ENVIADO_A_JEFE: 'Enviado a jefe',
  ENVIADO_A_CONTABILIDAD: 'Enviado a contabilidad',
  LIQUIDADO: 'Liquidado',
  RECHAZADO: 'Rechazado',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Registro creado',
  UPDATE: 'Registro actualizado',
  DELETE: 'Registro eliminado',
  APPROVE_MANAGER: 'Aprobado por jefe',
  APPROVE_ACCOUNTANT: 'Aprobado por contabilidad',
  SEND_TO_MANAGER: 'Enviado a jefe',
  SEND_TO_ACCOUNTANT: 'Enviado a contabilidad',
  COMPLETE: 'Completado',
  PAY: 'Pago registrado',
  REJECT: 'Rechazado',
  CANCEL: 'Cancelado',
  LIQUIDATE: 'Liquidado',
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ENTITIES = ['Anticipo', 'Factura', 'Viatico', 'Legalizacion', 'Gasto'] as const;

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
        : entity === 'Gasto'
          ? await prisma.gasto.findMany({ where, select })
          : await prisma.legalizacion.findMany({ where, select });

  return rows.map((row) => ({ ...row, entity }));
}

function getRequestNumber(entity: string, id?: number | null) {
  return id ? `${entity} No. ${id}` : entity;
}

const ENTITY_LABELS: Record<string, string> = {
  Anticipo: 'anticipo',
  Factura: 'factura',
  Gasto: 'gasto',
  Viatico: 'viático',
  Legalizacion: 'legalización',
};

function getActivityText(action: string, entity: string, entityId?: number | null, toState?: string) {
  const entityLabel = ENTITY_LABELS[entity] ?? entity.toLowerCase();
  const num = entityId ? ` No. ${entityId}` : '';
  const ref = `${entityLabel}${num}`;

  if (action === 'CREATE') return `Se registró un nuevo ${ref}`;
  if (action === 'UPDATE') return `Se actualizó el ${ref}`;
  if (action === 'DELETE') return `Se eliminó el ${ref}`;
  if (action === 'APPROVE_MANAGER') return `El jefe aprobó el ${ref}`;
  if (action === 'APPROVE_ACCOUNTANT') return `Contabilidad aprobó el ${ref}`;
  if (action === 'SEND_TO_MANAGER') return `Se envió el ${ref} a revisión del jefe`;
  if (action === 'SEND_TO_ACCOUNTANT') return `Se envió el ${ref} a contabilidad`;
  if (action === 'COMPLETE') return `Se completó el ${ref}`;
  if (action === 'PAY') return `Se registró el pago del ${ref}`;
  if (action === 'REJECT') return `Se rechazó el ${ref}`;
  if (action === 'CANCEL') return `Se canceló el ${ref}`;
  if (action === 'LIQUIDATE') return `Se liquidó el ${ref}`;
  if (action.startsWith('STATUS_CHANGE_')) {
    const estadoLabel = STATUS_LABELS[toState ?? ''] ?? toState ?? 'nuevo estado';
    return `El ${ref} cambió a "${estadoLabel}"`;
  }

  return `${ACTION_LABELS[action] ?? action} — ${ref}`;
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
    percent: STATUS_PROGRESS[toState ?? ''] ?? ACTION_PROGRESS[action] ?? 0,
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
            : request.entity === 'Gasto'
              ? '/registro-gastos'
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
