import { prisma } from '../lib/prisma.js';

/**
 * Repositorio de transiciones de estado.
 * Centraliza la creación de registros de auditoría cuando una entidad cambia de estado.
 * Ejemplo: Anticipo pasa de PENDING → APPROVED.
 */
export const stateTransitionRepository = {
  /**
   * Registra una transición de estado en la tabla StateTransition.
   * @param entity - Nombre de la entidad (ej: 'Anticipo', 'Viatico')
   * @param entityId - ID de la entidad que cambió
   * @param fromState - Estado anterior
   * @param toState - Estado nuevo
   * @param changedById - ID del usuario que realizó el cambio
   */
  async create(data: {
    entity: string;
    entityId: number;
    fromState: string;
    toState: string;
    changedById: number;
  }) {
    return prisma.stateTransition.create({ data });
  },
};
