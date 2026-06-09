import { anticipoRepository } from '../repositories/anticipo.repository.js';
import { stateTransitionRepository } from '../repositories/stateTransition.repository.js';
import { HttpError } from '../errors/httpError.js';
import { logActivity } from './activityLog.service.js';
import { CreateAnticipoDto } from '../dto/anticipo.dto.js';
import { ListFiltersDto } from '../dto/common.dto.js';

/**
 * Flujo de estados para Anticipos:
 *   PENDING → APPROVED_MANAGER → APPROVED_ACCOUNTANT → COMPLETED → PAID
 *   Cualquier estado (excepto PAID) → REJECTED
 *   PENDING | APPROVED_MANAGER → CANCELLED
 */
export const anticipoService = {
  async getAll(filters?: ListFiltersDto) {
    return anticipoRepository.findAll(filters);
  },

  async getById(id: number) {
    const anticipo = await anticipoRepository.findById(id);
    if (!anticipo) {
      throw new HttpError(404, 'Anticipo not found');
    }
    return anticipo;
  },

  async create(data: CreateAnticipoDto, userId: number) {
    const anticipo = await anticipoRepository.create({
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      createdById: userId,
    });

    await logActivity(userId, 'CREATE', 'Anticipo', anticipo.id, { toState: 'PENDING' });
    return anticipo;
  },

  /** Paso 1: Jefe Inmediato aprueba (PENDING → APPROVED_MANAGER) */
  async approve(id: number, approvedById: number) {
    const anticipo = await this.getById(id);
    if (anticipo.status !== 'PENDING') {
      throw new HttpError(400, `No se puede aprobar (Jefe). Estado actual: ${anticipo.status}. Debe ser PENDING.`);
    }

    const updated = await anticipoRepository.update(id, {
      status: 'APPROVED_MANAGER',
      approvedById,
    });

    await stateTransitionRepository.create({
      entity: 'Anticipo',
      entityId: id,
      fromState: 'PENDING',
      toState: 'APPROVED_MANAGER',
      changedById: approvedById,
    });

    await logActivity(approvedById, 'APPROVE_MANAGER', 'Anticipo', id, {
      fromState: 'PENDING',
      toState: 'APPROVED_MANAGER',
    });

    return updated;
  },

  /** Paso 2: Contabilidad aprueba (APPROVED_MANAGER → APPROVED_ACCOUNTANT) */
  async approveAccountant(id: number, userId: number) {
    const anticipo = await this.getById(id);
    if (anticipo.status !== 'APPROVED_MANAGER') {
      throw new HttpError(400, `No se puede aprobar (Contabilidad). Estado actual: ${anticipo.status}. Debe ser APPROVED_MANAGER.`);
    }

    const updated = await anticipoRepository.update(id, {
      status: 'APPROVED_ACCOUNTANT',
    });

    await stateTransitionRepository.create({
      entity: 'Anticipo',
      entityId: id,
      fromState: 'APPROVED_MANAGER',
      toState: 'APPROVED_ACCOUNTANT',
      changedById: userId,
    });

    await logActivity(userId, 'APPROVE_ACCOUNTANT', 'Anticipo', id, {
      fromState: 'APPROVED_MANAGER',
      toState: 'APPROVED_ACCOUNTANT',
    });

    return updated;
  },

  /** Paso 3: Pago (APPROVED_ACCOUNTANT → COMPLETED) */
  async complete(id: number, userId: number) {
    const anticipo = await this.getById(id);
    if (anticipo.status !== 'APPROVED_ACCOUNTANT') {
      throw new HttpError(400, `No se puede completar. Estado actual: ${anticipo.status}. Debe ser APPROVED_ACCOUNTANT.`);
    }

    const updated = await anticipoRepository.update(id, { status: 'COMPLETED' });

    await stateTransitionRepository.create({
      entity: 'Anticipo',
      entityId: id,
      fromState: 'APPROVED_ACCOUNTANT',
      toState: 'COMPLETED',
      changedById: userId,
    });

    await logActivity(userId, 'COMPLETE', 'Anticipo', id, {
      fromState: 'APPROVED_ACCOUNTANT',
      toState: 'COMPLETED',
    });

    return updated;
  },

  /** Paso 4: Marcar como Pagado (COMPLETED → PAID) */
  async pay(id: number, userId: number) {
    const anticipo = await this.getById(id);
    if (anticipo.status !== 'COMPLETED') {
      throw new HttpError(400, `No se puede pagar. Estado actual: ${anticipo.status}. Debe ser COMPLETED.`);
    }

    const updated = await anticipoRepository.update(id, { status: 'PAID' });

    await stateTransitionRepository.create({
      entity: 'Anticipo',
      entityId: id,
      fromState: 'COMPLETED',
      toState: 'PAID',
      changedById: userId,
    });

    await logActivity(userId, 'PAY', 'Anticipo', id, {
      fromState: 'COMPLETED',
      toState: 'PAID',
    });

    return updated;
  },

  /** Rechazar desde cualquier estado pendiente */
  async reject(id: number, userId: number) {
    const anticipo = await this.getById(id);
    const allowedStates = ['PENDING', 'APPROVED_MANAGER', 'APPROVED_ACCOUNTANT', 'COMPLETED'];
    if (!allowedStates.includes(anticipo.status)) {
      throw new HttpError(400, `No se puede rechazar. Estado actual: ${anticipo.status}.`);
    }

    const fromState = anticipo.status;
    const updated = await anticipoRepository.update(id, { status: 'REJECTED' });

    await stateTransitionRepository.create({
      entity: 'Anticipo',
      entityId: id,
      fromState,
      toState: 'REJECTED',
      changedById: userId,
    });

    await logActivity(userId, 'REJECT', 'Anticipo', id, { fromState, toState: 'REJECTED' });

    return updated;
  },

  /** Cancelar solicitud */
  async cancel(id: number, userId: number) {
    const anticipo = await this.getById(id);
    const allowedStates = ['PENDING', 'APPROVED_MANAGER'];
    if (!allowedStates.includes(anticipo.status)) {
      throw new HttpError(400, `No se puede cancelar. Estado actual: ${anticipo.status}.`);
    }

    const fromState = anticipo.status;
    const updated = await anticipoRepository.update(id, { status: 'CANCELLED' });

    await stateTransitionRepository.create({
      entity: 'Anticipo',
      entityId: id,
      fromState,
      toState: 'CANCELLED',
      changedById: userId,
    });

    await logActivity(userId, 'CANCEL', 'Anticipo', id, { fromState, toState: 'CANCELLED' });

    return updated;
  },

  async softDelete(id: number) {
    await this.getById(id);
    return anticipoRepository.softDelete(id);
  },
};
