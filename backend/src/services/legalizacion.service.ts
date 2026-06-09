import { LegalizacionRepository } from '../repositories/legalizacion.repository.js';
import { stateTransitionRepository } from '../repositories/stateTransition.repository.js';
import { logActivity } from './activityLog.service.js';
import { HttpError } from '../errors/httpError.js';
import { CreateLegalizacionDto } from '../dto/legalizacion.dto.js';
import { ListFiltersDto } from '../dto/common.dto.js';

/**
 * Flujo de estados para Legalizaciones:
 *   PENDING → APPROVED_MANAGER → APPROVED_ACCOUNTANT → COMPLETED → PAID
 */
export const LegalizacionService = {
  async getAll(filters?: ListFiltersDto) {
    return LegalizacionRepository.findAll(filters);
  },

  async getById(id: number) {
    const item = await LegalizacionRepository.findById(id);
    if (!item) throw new HttpError(404, 'Legalización no encontrada');
    return item;
  },

  async create(data: CreateLegalizacionDto & { createdById: number }) {
    const item = await LegalizacionRepository.create(data);
    await logActivity(data.createdById, 'CREATE', 'Legalizacion', item.id);
    return item;
  },

  async changeStatus(id: number, status: string, userId: number, allowedFrom: string[]) {
    const item = await this.getById(id);
    if (!allowedFrom.includes(item.status)) {
      throw new HttpError(400, `No se puede cambiar el estado desde ${item.status} a ${status}`);
    }

    const updated = await LegalizacionRepository.update(id, { status });
    
    await stateTransitionRepository.create({
      entity: 'Legalizacion',
      entityId: id,
      fromState: item.status,
      toState: status,
      changedById: userId
    });

    await logActivity(userId, `STATUS_CHANGE_${status}`, 'Legalizacion', id);

    return updated;
  },

  async approve(id: number, userId: number) {
    return this.changeStatus(id, 'APPROVED_MANAGER', userId, ['PENDING']);
  },

  async approveAccountant(id: number, userId: number) {
    return this.changeStatus(id, 'APPROVED_ACCOUNTANT', userId, ['APPROVED_MANAGER']);
  },

  async complete(id: number, userId: number) {
    return this.changeStatus(id, 'COMPLETED', userId, ['APPROVED_ACCOUNTANT']);
  },

  async pay(id: number, userId: number) {
    return this.changeStatus(id, 'PAID', userId, ['COMPLETED']);
  },

  async reject(id: number, userId: number) {
    return this.changeStatus(id, 'REJECTED', userId, ['PENDING', 'APPROVED_MANAGER', 'APPROVED_ACCOUNTANT']);
  },

  async cancel(id: number, userId: number) {
    return this.changeStatus(id, 'CANCELLED', userId, ['PENDING', 'APPROVED_MANAGER']);
  },

  async softDelete(id: number, userId: number) {
    const item = await this.getById(id);
    await LegalizacionRepository.softDelete(id);
    await logActivity(userId, 'DELETE', 'Legalizacion', id);
    return { success: true };
  }
};
