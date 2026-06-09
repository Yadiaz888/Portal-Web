import { facturaRepository } from '../repositories/factura.repository.js';
import { stateTransitionRepository } from '../repositories/stateTransition.repository.js';
import { HttpError } from '../errors/httpError.js';
import { logActivity } from './activityLog.service.js';
import { CreateFacturaDto } from '../dto/factura.dto.js';
import { ListFiltersDto } from '../dto/common.dto.js';

/**
 * Flujo de estados para Facturas:
 *   PENDING → APPROVED_MANAGER → APPROVED_ACCOUNTANT → COMPLETED → PAID
 *   Cualquier estado (excepto PAID) → REJECTED
 *   PENDING | APPROVED_MANAGER → CANCELLED
 */
export const facturaService = {
  async getAll(filters?: ListFiltersDto) {
    return facturaRepository.findAll(filters);
  },

  async getById(id: number) {
    const factura = await facturaRepository.findById(id);
    if (!factura) {
      throw new HttpError(404, 'Factura not found');
    }
    return factura;
  },

  async create(data: CreateFacturaDto, userId: number) {
    const factura = await facturaRepository.create({
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      vendor: data.vendor,
      invoiceNumber: data.invoiceNumber,
      createdById: userId,
    });

    await logActivity(userId, 'CREATE', 'Factura', factura.id, { toState: 'PENDING' });
    return factura;
  },

  /** Paso 1: Jefe Inmediato aprueba */
  async approve(id: number, userId: number) {
    const factura = await this.getById(id);
    if (factura.status !== 'PENDING') {
      throw new HttpError(400, `No se puede aprobar (Jefe). Estado actual: ${factura.status}. Debe ser PENDING.`);
    }

    const updated = await facturaRepository.update(id, { status: 'APPROVED_MANAGER' });

    await stateTransitionRepository.create({
      entity: 'Factura', entityId: id,
      fromState: 'PENDING', toState: 'APPROVED_MANAGER',
      changedById: userId,
    });

    await logActivity(userId, 'APPROVE_MANAGER', 'Factura', id, {
      fromState: 'PENDING', toState: 'APPROVED_MANAGER',
    });

    return updated;
  },

  /** Paso 2: Contabilidad aprueba */
  async approveAccountant(id: number, userId: number) {
    const factura = await this.getById(id);
    if (factura.status !== 'APPROVED_MANAGER') {
      throw new HttpError(400, `No se puede aprobar (Contabilidad). Estado actual: ${factura.status}. Debe ser APPROVED_MANAGER.`);
    }

    const updated = await facturaRepository.update(id, { status: 'APPROVED_ACCOUNTANT' });

    await stateTransitionRepository.create({
      entity: 'Factura', entityId: id,
      fromState: 'APPROVED_MANAGER', toState: 'APPROVED_ACCOUNTANT',
      changedById: userId,
    });

    await logActivity(userId, 'APPROVE_ACCOUNTANT', 'Factura', id, {
      fromState: 'APPROVED_MANAGER', toState: 'APPROVED_ACCOUNTANT',
    });

    return updated;
  },

  /** Paso 3: Pago */
  async complete(id: number, userId: number) {
    const factura = await this.getById(id);
    if (factura.status !== 'APPROVED_ACCOUNTANT') {
      throw new HttpError(400, `No se puede completar. Estado actual: ${factura.status}. Debe ser APPROVED_ACCOUNTANT.`);
    }

    const updated = await facturaRepository.update(id, { status: 'COMPLETED' });

    await stateTransitionRepository.create({
      entity: 'Factura', entityId: id,
      fromState: 'APPROVED_ACCOUNTANT', toState: 'COMPLETED',
      changedById: userId,
    });

    await logActivity(userId, 'COMPLETE', 'Factura', id, {
      fromState: 'APPROVED_ACCOUNTANT', toState: 'COMPLETED',
    });

    return updated;
  },

  /** Paso 4: Marcar como Pagado */
  async pay(id: number, userId: number) {
    const factura = await this.getById(id);
    if (factura.status !== 'COMPLETED') {
      throw new HttpError(400, `No se puede pagar. Estado actual: ${factura.status}. Debe ser COMPLETED.`);
    }

    const updated = await facturaRepository.update(id, { status: 'PAID' });

    await stateTransitionRepository.create({
      entity: 'Factura', entityId: id,
      fromState: 'COMPLETED', toState: 'PAID',
      changedById: userId,
    });

    await logActivity(userId, 'PAY', 'Factura', id, {
      fromState: 'COMPLETED', toState: 'PAID',
    });

    return updated;
  },

  async reject(id: number, userId: number) {
    const factura = await this.getById(id);
    const allowedStates = ['PENDING', 'APPROVED_MANAGER', 'APPROVED_ACCOUNTANT', 'COMPLETED'];
    if (!allowedStates.includes(factura.status)) {
      throw new HttpError(400, `No se puede rechazar. Estado actual: ${factura.status}.`);
    }

    const fromState = factura.status;
    const updated = await facturaRepository.update(id, { status: 'REJECTED' });

    await stateTransitionRepository.create({
      entity: 'Factura', entityId: id, fromState, toState: 'REJECTED', changedById: userId,
    });

    await logActivity(userId, 'REJECT', 'Factura', id, { fromState, toState: 'REJECTED' });

    return updated;
  },

  async cancel(id: number, userId: number) {
    const factura = await this.getById(id);
    const allowedStates = ['PENDING', 'APPROVED_MANAGER'];
    if (!allowedStates.includes(factura.status)) {
      throw new HttpError(400, `No se puede cancelar. Estado actual: ${factura.status}.`);
    }

    const fromState = factura.status;
    const updated = await facturaRepository.update(id, { status: 'CANCELLED' });

    await stateTransitionRepository.create({
      entity: 'Factura', entityId: id, fromState, toState: 'CANCELLED', changedById: userId,
    });

    await logActivity(userId, 'CANCEL', 'Factura', id, { fromState, toState: 'CANCELLED' });

    return updated;
  },

  async softDelete(id: number) {
    await this.getById(id);
    return facturaRepository.softDelete(id);
  },
};
