import { viaticoRepository } from '../repositories/viatico.repository.js';
import { stateTransitionRepository } from '../repositories/stateTransition.repository.js';
import { HttpError } from '../errors/httpError.js';
import { logActivity } from './activityLog.service.js';
import { CreateViaticoDto } from '../dto/viatico.dto.js';
import { ListFiltersDto } from '../dto/common.dto.js';

/**
 * Flujo de estados para Viáticos:
 *   PENDING → APPROVED_MANAGER → APPROVED_ACCOUNTANT → COMPLETED
 */
export const viaticoService = {
  async getAll(filters?: ListFiltersDto) {
    return viaticoRepository.findAll(filters);
  },

  async getById(id: number) {
    const viatico = await viaticoRepository.findById(id);
    if (!viatico) {
      throw new HttpError(404, 'Viatico not found');
    }
    return viatico;
  },

  async create(data: CreateViaticoDto, userId: number) {
    const viatico = await viaticoRepository.create({
      description: data.description,
      amount: data.amount,
      destination: data.destination,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      createdById: userId,
    });

    await logActivity(userId, 'CREATE', 'Viatico', viatico.id, { toState: 'PENDING' });
    return viatico;
  },

  async approve(id: number, userId: number) {
    const viatico = await this.getById(id);
    if (viatico.status !== 'PENDING') {
      throw new HttpError(400, `No se puede aprobar (Jefe). Estado actual: ${viatico.status}. Debe ser PENDING.`);
    }

    const updated = await viaticoRepository.update(id, { status: 'APPROVED_MANAGER' });

    await stateTransitionRepository.create({
      entity: 'Viatico', entityId: id,
      fromState: 'PENDING', toState: 'APPROVED_MANAGER',
      changedById: userId,
    });

    await logActivity(userId, 'APPROVE_MANAGER', 'Viatico', id, {
      fromState: 'PENDING', toState: 'APPROVED_MANAGER',
    });

    return updated;
  },

  async approveAccountant(id: number, userId: number) {
    const viatico = await this.getById(id);
    if (viatico.status !== 'APPROVED_MANAGER') {
      throw new HttpError(400, `No se puede aprobar (Contabilidad). Estado actual: ${viatico.status}. Debe ser APPROVED_MANAGER.`);
    }

    const updated = await viaticoRepository.update(id, { status: 'APPROVED_ACCOUNTANT' });

    await stateTransitionRepository.create({
      entity: 'Viatico', entityId: id,
      fromState: 'APPROVED_MANAGER', toState: 'APPROVED_ACCOUNTANT',
      changedById: userId,
    });

    await logActivity(userId, 'APPROVE_ACCOUNTANT', 'Viatico', id, {
      fromState: 'APPROVED_MANAGER', toState: 'APPROVED_ACCOUNTANT',
    });

    return updated;
  },

  async complete(id: number, userId: number) {
    const viatico = await this.getById(id);
    if (viatico.status !== 'APPROVED_ACCOUNTANT') {
      throw new HttpError(400, `No se puede completar. Estado actual: ${viatico.status}. Debe ser APPROVED_ACCOUNTANT.`);
    }

    const updated = await viaticoRepository.update(id, { status: 'COMPLETED' });

    await stateTransitionRepository.create({
      entity: 'Viatico', entityId: id,
      fromState: 'APPROVED_ACCOUNTANT', toState: 'COMPLETED',
      changedById: userId,
    });

    await logActivity(userId, 'COMPLETE', 'Viatico', id, {
      fromState: 'APPROVED_ACCOUNTANT', toState: 'COMPLETED',
    });

    return updated;
  },

  async pay(id: number, userId: number) {
    const viatico = await this.getById(id);
    if (viatico.status !== 'COMPLETED') {
      throw new HttpError(400, `No se puede pagar. Estado actual: ${viatico.status}. Debe ser COMPLETED.`);
    }

    const updated = await viaticoRepository.update(id, { status: 'PAID' });

    await stateTransitionRepository.create({
      entity: 'Viatico', entityId: id,
      fromState: 'COMPLETED', toState: 'PAID',
      changedById: userId,
    });

    await logActivity(userId, 'PAY', 'Viatico', id, {
      fromState: 'COMPLETED', toState: 'PAID',
    });

    return updated;
  },

  async reject(id: number, userId: number) {
    const viatico = await this.getById(id);
    const allowedStates = ['PENDING', 'APPROVED_MANAGER', 'APPROVED_ACCOUNTANT'];
    if (!allowedStates.includes(viatico.status)) {
      throw new HttpError(400, `No se puede rechazar. Estado actual: ${viatico.status}.`);
    }

    const fromState = viatico.status;
    const updated = await viaticoRepository.update(id, { status: 'REJECTED' });

    await stateTransitionRepository.create({
      entity: 'Viatico', entityId: id, fromState, toState: 'REJECTED', changedById: userId,
    });

    await logActivity(userId, 'REJECT', 'Viatico', id, { fromState, toState: 'REJECTED' });

    return updated;
  },

  async cancel(id: number, userId: number) {
    const viatico = await this.getById(id);
    const allowedStates = ['PENDING', 'APPROVED_MANAGER'];
    if (!allowedStates.includes(viatico.status)) {
      throw new HttpError(400, `No se puede cancelar. Estado actual: ${viatico.status}.`);
    }

    const fromState = viatico.status;
    const updated = await viaticoRepository.update(id, { status: 'CANCELLED' });

    await stateTransitionRepository.create({
      entity: 'Viatico', entityId: id, fromState, toState: 'CANCELLED', changedById: userId,
    });

    await logActivity(userId, 'CANCEL', 'Viatico', id, { fromState, toState: 'CANCELLED' });

    return updated;
  },

  async softDelete(id: number) {
    await this.getById(id);
    return viaticoRepository.softDelete(id);
  },
};
