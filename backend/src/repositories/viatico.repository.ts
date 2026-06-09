import { prisma } from '../lib/prisma.js';

/**
 * Campos del usuario que se incluyen en las respuestas de viáticos.
 * Evita exponer datos sensibles como password o roleId.
 */
const userSelect = { id: true, name: true, email: true };

/**
 * Repositorio de viáticos.
 * Centraliza todas las consultas a la tabla Viatico.
 * Los servicios nunca deben acceder a Prisma directamente para esta entidad.
 */
export const viaticoRepository = {
  /**
   * Lista todos los viáticos no eliminados (soft delete), con filtros opcionales.
   * Siempre incluye el usuario creador.
   */
  async findAll(filters?: { status?: string | string[]; createdById?: number }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (Array.isArray(filters?.status)) where.status = { in: filters.status };
    else if (filters?.status) where.status = filters.status;
    if (filters?.createdById) where.createdById = filters.createdById;

    return prisma.viatico.findMany({
      where,
      include: {
        createdBy: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Busca un viático por ID. Retorna null si no existe. */
  async findById(id: number) {
    return prisma.viatico.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
      },
    });
  },

  /** Crea un nuevo viático con estado PENDING por defecto (definido en schema). */
  async create(data: {
    description: string;
    amount: number;
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    createdById: number;
  }) {
    return prisma.viatico.create({
      data: {
        description: data.description,
        amount: data.amount,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: userSelect },
      },
    });
  },

  /** Actualiza campos arbitrarios de un viático (status, etc). */
  async update(id: number, data: Record<string, unknown>) {
    return prisma.viatico.update({
      where: { id },
      data,
      include: {
        createdBy: { select: userSelect },
      },
    });
  },

  /** Marca un viático como eliminado (soft delete). No borra de la DB. */
  async softDelete(id: number) {
    return prisma.viatico.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
