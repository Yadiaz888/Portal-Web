import { prisma } from '../lib/prisma.js';

/**
 * Repositorio de gastos.
 * Centraliza todas las consultas a la tabla Gasto.
 */
export const GastoRepository = {
  /** Lista todos los gastos no eliminados con filtros opcionales. */
  async findAll(filters?: { legalizacionId?: number; createdById?: number; skip?: number; take?: number; orConditions?: any[] }) {
    const where: any = { deletedAt: null };
    if (filters?.legalizacionId) where.legalizacionId = filters.legalizacionId;
    if (filters?.createdById) where.createdById = filters.createdById;
    if (filters?.orConditions && filters.orConditions.length > 0) {
      where.OR = filters.orConditions;
    }

    return prisma.gasto.findMany({
      where,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 100,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Busca un gasto por ID. Retorna null si no existe o fue eliminado. */
  async findById(id: number) {
    return prisma.gasto.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Crea un nuevo gasto con estado inicial y userId. */
  async create(data: {
    amount: number;
    currency?: string;
    description?: string;
    tipo: string;
    origen?: string;
    legalizacionId?: number;
    createdById: number;
    status?: string;
    nitProveedor?: string;
    razonSocial?: string;
    numeroFactura?: string;
    fechaEmision?: Date;
    subtotal?: number;
    iva?: number;
    sapDocId?: string;
    ocrConfidence?: number;
  }) {
    return prisma.gasto.create({
      data: {
        amount: data.amount,
        currency: data.currency ?? 'COP',
        description: data.description,
        tipo: data.tipo,
        origen: data.origen ?? 'MANUAL',
        legalizacionId: data.legalizacionId,
        createdById: data.createdById,
        status: data.status ?? 'CREADO',
        nitProveedor: data.nitProveedor,
        razonSocial: data.razonSocial,
        numeroFactura: data.numeroFactura,
        fechaEmision: data.fechaEmision,
        subtotal: data.subtotal,
        iva: data.iva,
        sapDocId: data.sapDocId,
        ocrConfidence: data.ocrConfidence,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Actualiza campos arbitrarios de un gasto. */
  async update(id: number, data: Record<string, unknown>) {
    return prisma.gasto.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Marca un gasto como eliminado (soft delete). No borra de la DB. */
  async softDelete(id: number) {
    return prisma.gasto.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  /** Suma el total de gastos activos para una legalización. */
  async sumByLegalizacion(legalizacionId: number) {
    const result = await prisma.gasto.aggregate({
      where: { legalizacionId, deletedAt: null },
      _sum: { amount: true },
      _count: true,
    });
    return {
      total: result._sum.amount ?? 0,
      count: result._count,
    };
  },
};
