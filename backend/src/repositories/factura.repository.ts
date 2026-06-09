import { prisma } from '../lib/prisma.js';

/**
 * Campos del usuario que se incluyen en las respuestas de facturas.
 * Evita exponer datos sensibles como password o roleId.
 */
const userSelect = { id: true, name: true, email: true };

/**
 * Repositorio de facturas.
 * Centraliza todas las consultas a la tabla Factura.
 * Los servicios nunca deben acceder a Prisma directamente para esta entidad.
 */
export const facturaRepository = {
  /**
   * Lista todas las facturas no eliminadas (soft delete), con filtros opcionales.
   * Siempre incluye el usuario creador.
   */
  async findAll(filters?: { status?: string | string[]; createdById?: number }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (Array.isArray(filters?.status)) where.status = { in: filters.status };
    else if (filters?.status) where.status = filters.status;
    if (filters?.createdById) where.createdById = filters.createdById;

    return prisma.factura.findMany({
      where,
      include: {
        createdBy: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Busca una factura por ID. Retorna null si no existe. */
  async findById(id: number) {
    return prisma.factura.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
      },
    });
  },

  /** Crea una nueva factura con estado PENDING por defecto (definido en schema). */
  async create(data: {
    amount: number;
    currency: string;
    description?: string;
    vendor?: string;
    invoiceNumber?: string;
    createdById: number;
  }) {
    return prisma.factura.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: userSelect },
      },
    });
  },

  /** Actualiza campos arbitrarios de una factura (status, etc). */
  async update(id: number, data: Record<string, unknown>) {
    return prisma.factura.update({
      where: { id },
      data,
      include: {
        createdBy: { select: userSelect },
      },
    });
  },

  /** Marca una factura como eliminada (soft delete). No borra de la DB. */
  async softDelete(id: number) {
    return prisma.factura.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
