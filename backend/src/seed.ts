import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const mainResources = ['anticipo', 'factura', 'viatico', 'legalizacion', 'gasto'];
const resourceActions = ['create', 'read', 'update', 'delete', 'approve', 'approve_accountant', 'cancel', 'complete', 'pay', 'reject', 'send_to_approval_manager', 'send_to_approval_accountant', 'liquidate'];
const roleNames = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'] as const;

const extraPermissions = [
  { action: 'read', resource: 'user' },
  { action: 'create', resource: 'user' },
  { action: 'update', resource: 'user' },
  { action: 'delete', resource: 'user' },
  { action: 'read', resource: 'activitylog' },
];

interface PermRecord {
  id: number;
  action: string;
  resource: string;
}

async function clearDemoData() {
  await prisma.activityLog.deleteMany();
  await prisma.stateTransition.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.legalizacion.deleteMany();
  await prisma.viatico.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.anticipo.deleteMany();
}

async function ensureRoles() {
  const roles: Record<string, { id: number; name: string }> = {};

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: `${name} role` },
      create: { name, description: `${name} role` },
    });
    roles[name] = role;
  }

  return roles;
}

async function ensurePermissions() {
  const desired = [
    ...mainResources.flatMap(resource => resourceActions.map(action => ({ action, resource }))),
    ...extraPermissions,
  ];
  const desiredKeys = new Set(desired.map(permission => `${permission.action}:${permission.resource}`));
  const allPermissions: PermRecord[] = [];

  for (const { action, resource } of desired) {
    let permission = await prisma.permission.findFirst({ where: { action, resource } });
    if (!permission) {
      permission = await prisma.permission.create({ data: { action, resource } });
    }
    allPermissions.push(permission);
  }

  const existingPermissions = await prisma.permission.findMany();
  for (const permission of existingPermissions) {
    if (!desiredKeys.has(`${permission.action}:${permission.resource}`)) {
      await prisma.rolePermission.deleteMany({ where: { permissionId: permission.id } });
      await prisma.permission.delete({ where: { id: permission.id } });
    }
  }

  return allPermissions;
}

async function assignPermissions(roleId: number, perms: PermRecord[]) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });

  for (const perm of perms) {
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId: perm.id,
      },
    });
  }
}

async function configureRolePermissions(roles: Record<string, { id: number; name: string }>, permissions: PermRecord[]) {
  await assignPermissions(roles.ADMIN.id, permissions);

  // MANAGER: puede ver todo, aprobar jefe (facturas/anticipos), enviar gasto a contabilidad
  const managerActions = ['create', 'read', 'update', 'approve', 'reject', 'send_to_approval_accountant'];
  await assignPermissions(roles.MANAGER.id, permissions.filter(permission =>
    (mainResources.includes(permission.resource) && managerActions.includes(permission.action)) ||
    (permission.resource === 'user' && permission.action === 'read') ||
    (permission.resource === 'activitylog' && permission.action === 'read')
  ));

  // ACCOUNTANT: puede liquidar gastos y rechazarlos; también ver todo
  const accountantActions = ['create', 'read', 'approve_accountant', 'complete', 'pay', 'reject', 'liquidate'];
  await assignPermissions(roles.ACCOUNTANT.id, permissions.filter(permission =>
    mainResources.includes(permission.resource) && accountantActions.includes(permission.action)
  ));

  // USER: crea, lee, edita sus propios registros; puede enviar gastos a aprobación del jefe
  const userActions = ['create', 'read', 'update', 'cancel', 'send_to_approval_manager'];
  await assignPermissions(roles.USER.id, permissions.filter(permission =>
    mainResources.includes(permission.resource) && userActions.includes(permission.action)
  ));
}

async function ensureUsers(roles: Record<string, { id: number; name: string }>) {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const usersData = [
    { email: 'jhoana@justtime.com', name: 'Jhoana Batista', role: 'ADMIN' },
    { email: 'carlos@justtime.com', name: 'Carlos Pérez', role: 'MANAGER' },
    { email: 'maria@justtime.com', name: 'María López', role: 'USER' },
    { email: 'admin@portal.com', name: 'Carlos Admin', role: 'ADMIN' },
    { email: 'manager@portal.com', name: 'Laura Gerente', role: 'MANAGER' },
    { email: 'accountant@portal.com', name: 'Maria Contadora', role: 'ACCOUNTANT' },
    { email: 'user@portal.com', name: 'Juan Empleado', role: 'USER' },
    { email: 'user2@portal.com', name: 'Ana Solicitante', role: 'USER' },
  ];

  const users: Record<string, { id: number; email: string; name: string | null }> = {};

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        roleId: roles[userData.role].id,
        password: hashedPassword,
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        roleId: roles[userData.role].id,
      },
    });
    users[user.email] = user;
  }

  return users;
}

function activityDetails(status: string) {
  return JSON.stringify({ toState: status });
}

function demoDate(index: number) {
  return new Date(2026, Math.max(0, 4 - (index % 5)), 5 + index);
}

function demoUpdatedDate(index: number) {
  return new Date(2026, Math.max(0, 4 - (index % 5)), 10 + index);
}

async function createActivity(userId: number, action: string, entity: string, entityId: number, status = 'PENDING') {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details: activityDetails(status),
    },
  });
}

async function createDemoRequests(users: Record<string, { id: number; email: string; name: string | null }>) {
  const userId = (email: string) => users[email].id;

  const anticipos = [
    { amount: 2500000, description: 'Viaje comercial a Bogota para rueda de proveedores', status: 'PENDING', createdByEmail: 'user@portal.com' },
    { amount: 1800000, description: 'Compra de equipos menores para oficina regional', status: 'APPROVED_MANAGER', createdByEmail: 'user@portal.com', approvedByEmail: 'manager@portal.com' },
    { amount: 950000, description: 'Materiales para capacitacion interna', status: 'APPROVED_ACCOUNTANT', createdByEmail: 'user@portal.com', approvedByEmail: 'manager@portal.com' },
    { amount: 3200000, description: 'Proyecto cliente Acme Corp', status: 'REJECTED', createdByEmail: 'user2@portal.com' },
    { amount: 750000, description: 'Gastos de representacion comercial', status: 'PENDING', createdByEmail: 'accountant@portal.com' },
    { amount: 4100000, description: 'Visita de auditoria a planta de Cali', status: 'PAID', createdByEmail: 'user2@portal.com', approvedByEmail: 'manager@portal.com' },
    { amount: 1250000, description: 'Mi anticipo para reunion con cliente estrategico', status: 'APPROVED_MANAGER', createdByEmail: 'user@portal.com', approvedByEmail: 'manager@portal.com' },
    { amount: 2100000, description: 'Mi anticipo en validacion de pago', status: 'COMPLETED', createdByEmail: 'user@portal.com', approvedByEmail: 'manager@portal.com' },
    // ADMIN and MANAGER specific data
    { amount: 1500000, description: 'Anticipo Admin para compras', status: 'PENDING', createdByEmail: 'admin@portal.com' },
    { amount: 3500000, description: 'Anticipo Carlos para viaje', status: 'APPROVED_MANAGER', createdByEmail: 'carlos@justtime.com', approvedByEmail: 'admin@portal.com' },
  ];

  for (const [index, item] of anticipos.entries()) {
    const created = await prisma.anticipo.create({
      data: {
        amount: item.amount,
        currency: 'COP',
        description: item.description,
        status: item.status,
        createdById: userId(item.createdByEmail),
        approvedById: item.approvedByEmail ? userId(item.approvedByEmail) : undefined,
        createdAt: demoDate(index),
        updatedAt: demoUpdatedDate(index),
      },
    });
    await createActivity(userId(item.createdByEmail), 'CREATE', 'Anticipo', created.id, 'PENDING');
  }

  const facturas = [
    { amount: 4500000, description: 'Servicios de consultoria operacional', vendor: 'Consultores S.A.S', invoiceNumber: 'FAC-2026-001', status: 'PENDING', createdByEmail: 'accountant@portal.com' },
    { amount: 1200000, description: 'Suministros de oficina central', vendor: 'OfficeMax Colombia', invoiceNumber: 'FAC-2026-002', status: 'APPROVED_MANAGER', createdByEmail: 'accountant@portal.com' },
    { amount: 8900000, description: 'Licencias anuales de software', vendor: 'Microsoft Colombia', invoiceNumber: 'FAC-2026-003', status: 'PENDING', createdByEmail: 'user@portal.com' },
    { amount: 350000, description: 'Servicio de mensajeria', vendor: 'Servientrega', invoiceNumber: 'FAC-2026-004', status: 'REJECTED', createdByEmail: 'user2@portal.com' },
    { amount: 6700000, description: 'Mantenimiento de servidores Q1', vendor: 'CloudTech SAS', invoiceNumber: 'FAC-2026-005', status: 'PAID', createdByEmail: 'user@portal.com' },
    { amount: 2800000, description: 'Factura propia pendiente de contabilidad', vendor: 'Eventos Andinos SAS', invoiceNumber: 'FAC-2026-006', status: 'APPROVED_MANAGER', createdByEmail: 'user@portal.com' },
    { amount: 980000, description: 'Factura propia en validacion de pasarela', vendor: 'Transporte Ejecutivo SAS', invoiceNumber: 'FAC-2026-007', status: 'COMPLETED', createdByEmail: 'user@portal.com' },
    // ADMIN and MANAGER
    { amount: 1250000, description: 'Factura servidor Admin', vendor: 'AWS', invoiceNumber: 'AWS-2026', status: 'PENDING', createdByEmail: 'admin@portal.com' },
    { amount: 800000, description: 'Factura licencias Carlos', vendor: 'Adobe', invoiceNumber: 'AD-111', status: 'APPROVED_MANAGER', createdByEmail: 'carlos@justtime.com' },
  ];

  for (const [index, item] of facturas.entries()) {
    const created = await prisma.factura.create({
      data: {
        amount: item.amount,
        currency: 'COP',
        description: item.description,
        vendor: item.vendor,
        invoiceNumber: item.invoiceNumber,
        status: item.status,
        createdById: userId(item.createdByEmail),
        createdAt: demoDate(index + 2),
        updatedAt: demoUpdatedDate(index + 2),
      },
    });
    await createActivity(userId(item.createdByEmail), 'CREATE', 'Factura', created.id, 'PENDING');
  }

  const viaticos = [
    { description: 'Viaje a Medellin para negociacion con cliente', amount: 1500000, destination: 'Medellin', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'), status: 'PENDING', createdByEmail: 'user@portal.com' },
    { description: 'Capacitacion tecnica en Cali', amount: 2200000, destination: 'Cali', startDate: new Date('2026-06-10'), endDate: new Date('2026-06-12'), status: 'APPROVED_MANAGER', createdByEmail: 'user@portal.com' },
    { description: 'Auditoria sucursal Barranquilla', amount: 3100000, destination: 'Barranquilla', startDate: new Date('2026-07-01'), endDate: new Date('2026-07-05'), status: 'PENDING', createdByEmail: 'accountant@portal.com' },
    { description: 'Feria empresarial Cartagena', amount: 4000000, destination: 'Cartagena', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-18'), status: 'PENDING', createdByEmail: 'user2@portal.com' },
    { description: 'Revision de planta Bucaramanga', amount: 1800000, destination: 'Bucaramanga', startDate: new Date('2026-08-01'), endDate: new Date('2026-08-02'), status: 'REJECTED', createdByEmail: 'user2@portal.com' },
    // ADMIN and MANAGER
    { description: 'Viaje gerencial Carlos', amount: 3500000, destination: 'Bogota', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-05'), status: 'PENDING', createdByEmail: 'carlos@justtime.com' },
    { description: 'Convencion Admin', amount: 5000000, destination: 'Medellin', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-05'), status: 'APPROVED_MANAGER', createdByEmail: 'admin@portal.com' },
  ];

  for (const [index, item] of viaticos.entries()) {
    const created = await prisma.viatico.create({
      data: {
        description: item.description,
        amount: item.amount,
        destination: item.destination,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status,
        createdById: userId(item.createdByEmail),
        createdAt: demoDate(index + 4),
        updatedAt: demoUpdatedDate(index + 4),
      },
    });
    await createActivity(userId(item.createdByEmail), 'CREATE', 'Viatico', created.id, 'PENDING');
  }

  const legalizaciones = [
    { description: 'Legalizacion anticipo Bogota con recibos completos', amount: 2450000, status: 'PENDING', createdByEmail: 'user@portal.com' },
    { description: 'Legalizacion compra de equipos con soportes', amount: 1800000, status: 'APPROVED_MANAGER', createdByEmail: 'user@portal.com' },
    { description: 'Legalizacion gastos de capacitacion', amount: 2100000, status: 'APPROVED_ACCOUNTANT', createdByEmail: 'user2@portal.com' },
    { description: 'Legalizacion viaticos Medellin', amount: 1480000, status: 'PAID', createdByEmail: 'accountant@portal.com' },
    { description: 'Legalizacion visita comercial eje cafetero', amount: 980000, status: 'REJECTED', createdByEmail: 'user@portal.com' },
    { description: 'Mi legalizacion esperando contabilidad', amount: 1250000, status: 'APPROVED_MANAGER', createdByEmail: 'user@portal.com' },
    { description: 'Mi legalizacion en validacion de pago', amount: 2100000, status: 'COMPLETED', createdByEmail: 'user@portal.com' },
    // ADMIN and MANAGER
    { description: 'Legalizacion equipos Admin', amount: 1500000, status: 'PENDING', createdByEmail: 'admin@portal.com' },
    { description: 'Legalizacion Carlos M', amount: 3500000, status: 'PENDING', createdByEmail: 'carlos@justtime.com' },
  ];

  const createdLegalizaciones: { id: number; createdByEmail: string }[] = [];
  for (const [index, item] of legalizaciones.entries()) {
    const created = await prisma.legalizacion.create({
      data: {
        description: item.description,
        amount: item.amount,
        status: item.status,
        createdById: userId(item.createdByEmail),
        createdAt: demoDate(index + 6),
        updatedAt: demoUpdatedDate(index + 6),
      },
    });
    createdLegalizaciones.push({ id: created.id, createdByEmail: item.createdByEmail });
    await createActivity(userId(item.createdByEmail), 'CREATE', 'Legalizacion', created.id, 'PENDING');
  }

  // --- Demo Gastos (registrar gasto module) con estados del flujo ---
  const demoGastos = [
    { amount: 350000, tipo: 'RECIBO', description: 'Taxi aeropuerto - ida y vuelta', status: 'CREADO', createdByEmail: 'user@portal.com' },
    { amount: 820000, tipo: 'FACTURA', description: 'Hotel 2 noches', status: 'ENVIADO_A_JEFE', createdByEmail: 'user@portal.com' },
    { amount: 150000, tipo: 'RECIBO', description: 'Alimentación día 1', status: 'ENVIADO_A_CONTABILIDAD', createdByEmail: 'user@portal.com' },
    { amount: 95000, tipo: 'OTRO', description: 'Papelería y materiales', status: 'LIQUIDADO', createdByEmail: 'user2@portal.com' },
    { amount: 1200000, tipo: 'FACTURA', description: 'Alquiler equipo audiovisual', status: 'RECHAZADO', createdByEmail: 'user2@portal.com' },
    { amount: 180000, tipo: 'RECIBO', description: 'Transporte local', status: 'CREADO', createdByEmail: 'user2@portal.com' },
    { amount: 450000, tipo: 'FACTURA', description: 'Materiales de oficina', status: 'ENVIADO_A_JEFE', createdByEmail: 'maria@justtime.com' },
    { amount: 320000, tipo: 'RECIBO', description: 'Cena de negocios', status: 'CREADO', createdByEmail: 'admin@portal.com' },
  ];

  for (const [index, gasto] of demoGastos.entries()) {
    const leg = createdLegalizaciones[index % Math.min(3, createdLegalizaciones.length)];
    if (leg) {
      const created = await prisma.gasto.create({
        data: {
          amount: gasto.amount,
          currency: 'COP',
          description: gasto.description,
          tipo: gasto.tipo,
          status: gasto.status,
          legalizacionId: leg.id,
          createdById: userId(gasto.createdByEmail),
        },
      });
      // Registrar transición inicial en StateTransition
      await prisma.stateTransition.create({
        data: {
          entity: 'Gasto',
          entityId: created.id,
          fromState: 'NUEVO',
          toState: 'CREADO',
          changedById: userId(gasto.createdByEmail),
        },
      });
      await createActivity(userId(gasto.createdByEmail), 'CREATE', 'Gasto', created.id, gasto.status);
    }
  }

  return {
    anticipos: anticipos.length,
    facturas: facturas.length,
    viaticos: viaticos.length,
    legalizaciones: legalizaciones.length,
    gastos: demoGastos.length,
  };
}

async function main() {
  console.log('Seeding database...');
  await clearDemoData();

  const roles = await ensureRoles();
  const permissions = await ensurePermissions();
  await configureRolePermissions(roles, permissions);
  const users = await ensureUsers(roles);
  const counts = await createDemoRequests(users);

  console.log('Seed completado.');
  console.table([
    { role: 'ADMIN', email: 'jhoana@justtime.com', password: 'password123' },
    { role: 'MANAGER', email: 'carlos@justtime.com', password: 'password123' },
    { role: 'USER', email: 'maria@justtime.com', password: 'password123' },
    { role: 'ADMIN', email: 'admin@portal.com', password: 'password123' },
    { role: 'MANAGER', email: 'manager@portal.com', password: 'password123' },
    { role: 'ACCOUNTANT', email: 'accountant@portal.com', password: 'password123' },
    { role: 'USER', email: 'user@portal.com', password: 'password123' },
    { role: 'USER', email: 'user2@portal.com', password: 'password123' },
  ]);
  console.log(counts);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
