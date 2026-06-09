import { prisma } from '../lib/prisma.js';

/**
 * Campos del usuario que se incluyen en las respuestas.
 * Evita exponer datos sensibles como password o roleId.
 */
const userSelect = { id: true, name: true, email: true };

/**
 * Repositorio de legalizaciones.
 * Centraliza todas las consultas a la tabla Legalizacion.
 * Los servicios nunca deben acceder a Prisma directamente para esta entidad.
 */
export const LegalizacionRepository = {
  /**
   * Lista todas las legalizaciones no eliminadas (soft delete), con filtros opcionales.
   * Siempre incluye el usuario creador.
   */
  async findAll(filters?: { status?: string | string[]; createdById?: number }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (Array.isArray(filters?.status)) where.status = { in: filters.status };
    else if (filters?.status) where.status = filters.status;
    if (filters?.createdById) where.createdById = filters.createdById;

    return prisma.legalizacion.findMany({
      where,
      include: {
        createdBy: { select: userSelect }
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Busca una legalización por ID. Retorna null si no existe. */
  async findById(id: number) {
    return prisma.legalizacion.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: userSelect }
      },
    });
  },

  /** Crea una nueva legalización con estado PENDING por defecto. */
  async create(data: { description: string; amount: number; createdById: number }) {
    return prisma.legalizacion.create({ 
      data,
      include: {
        createdBy: { select: userSelect }
      }
    });
  },

  /** Actualiza campos arbitrarios de una legalización (status, etc). */
  async update(id: number, data: any) {
    return prisma.legalizacion.update({ 
      where: { id }, 
      data,
      include: {
        createdBy: { select: userSelect }
      }
    });
  },

  /** Marca una legalización como eliminada (soft delete). No borra de la DB. */
  async softDelete(id: number) {
    return prisma.legalizacion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
};
