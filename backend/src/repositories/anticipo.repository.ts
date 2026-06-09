import { prisma } from '../lib/prisma.js';

/**
 * Campos del usuario que se incluyen en las respuestas de anticipos.
 * Evita exponer datos sensibles como password o roleId.
 */
const userSelect = { id: true, name: true, email: true };

/**
 * Repositorio de anticipos.
 * Centraliza todas las consultas a la tabla Anticipo.
 * Los servicios nunca deben acceder a Prisma directamente para esta entidad.
 */
export const anticipoRepository = {
  /**
   * Lista todos los anticipos no eliminados (soft delete), con filtros opcionales.
   * Siempre incluye el usuario creador y aprobador.
   */
  async findAll(filters?: { status?: string | string[]; createdById?: number }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (Array.isArray(filters?.status)) where.status = { in: filters.status };
    else if (filters?.status) where.status = filters.status;
    if (filters?.createdById) where.createdById = filters.createdById;

    return prisma.anticipo.findMany({
      where,
      include: {
        createdBy: { select: userSelect },
        approvedBy: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Busca un anticipo por ID. Retorna null si no existe. */
  async findById(id: number) {
    return prisma.anticipo.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
        approvedBy: { select: userSelect },
      },
    });
  },

  /** Crea un nuevo anticipo con estado PENDING por defecto (definido en schema). */
  async create(data: { amount: number; currency: string; description?: string; createdById: number }) {
    return prisma.anticipo.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: userSelect },
        approvedBy: { select: userSelect },
      },
    });
  },

  /** Actualiza campos arbitrarios de un anticipo (status, approvedById, etc). */
  async update(id: number, data: Record<string, unknown>) {
    return prisma.anticipo.update({
      where: { id },
      data,
      include: {
        createdBy: { select: userSelect },
        approvedBy: { select: userSelect },
      },
    });
  },

  /** Marca un anticipo como eliminado (soft delete). No borra de la DB. */
  async softDelete(id: number) {
    return prisma.anticipo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
