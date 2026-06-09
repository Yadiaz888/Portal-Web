import { GastoRepository } from '../repositories/gasto.repository.js';
import { stateTransitionRepository } from '../repositories/stateTransition.repository.js';
import { logActivity } from './activityLog.service.js';
import { HttpError } from '../errors/httpError.js';
import { CreateGastoDto, UpdateGastoDto } from '../dto/gasto.dto.js';

/**
 * Flujo de estados para Gastos (módulo "Registrar Gasto"):
 *   CREADO → ENVIADO_A_JEFE → ENVIADO_A_CONTABILIDAD → LIQUIDADO
 *   Cualquier estado activo → RECHAZADO  (solo ACCOUNTANT o ADMIN)
 *
 * Regla clave: ningún rol (ni ADMIN) puede saltar estados; todo cambio queda
 * registrado en StateTransition para garantizar trazabilidad completa.
 */
export const GastoService = {
  // ─── Consultas ────────────────────────────────────────────────────────────

  async getAll(filters?: { legalizacionId?: number; createdById?: number; skip?: number; take?: number; orConditions?: any[] }) {
    return GastoRepository.findAll(filters);
  },

  async getById(id: number) {
    const item = await GastoRepository.findById(id);
    if (!item) throw new HttpError(404, 'Gasto no encontrado');
    return item;
  },

  // ─── CRUD básico ──────────────────────────────────────────────────────────

  async create(data: CreateGastoDto, userId: number) {
    const item = await GastoRepository.create({
      amount: data.amount,
      currency: data.currency ?? 'COP',
      description: data.description,
      tipo: data.tipo,
      origen: data.origen ?? 'MANUAL',
      legalizacionId: data.legalizacionId,
      createdById: userId,
      status: 'CREADO',
      nitProveedor: data.nitProveedor,
      razonSocial: data.razonSocial,
      numeroFactura: data.numeroFactura,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : undefined,
      subtotal: data.subtotal,
      iva: data.iva,
      sapDocId: data.sapDocId,
      ocrConfidence: data.ocrConfidence,
    });

    // Registro inicial de trazabilidad
    await stateTransitionRepository.create({
      entity: 'Gasto',
      entityId: item.id,
      fromState: 'NUEVO',
      toState: 'CREADO',
      changedById: userId,
    });

    await logActivity(userId, 'CREATE', 'Gasto', item.id, { toState: 'CREADO', origen: data.origen ?? 'MANUAL' });
    return item;
  },

  /**
   * Edición solo disponible en estado CREADO por el creador o ADMIN.
   * La validación de quién puede editar se hace en la capa de permisos del middleware.
   */
  async update(id: number, data: UpdateGastoDto, userId: number) {
    const gasto = await this.getById(id);
    if (gasto.status !== 'CREADO') {
      throw new HttpError(400, `Solo se puede editar un gasto en estado CREADO. Estado actual: ${gasto.status}`);
    }
    const updated = await GastoRepository.update(id, data as Record<string, unknown>);
    await logActivity(userId, 'UPDATE', 'Gasto', id, { status: gasto.status });
    return updated;
  },

  async softDelete(id: number, userId: number) {
    const gasto = await this.getById(id);
    if (!['CREADO', 'RECHAZADO'].includes(gasto.status)) {
      throw new HttpError(400, `No se puede eliminar un gasto en estado ${gasto.status}`);
    }
    await GastoRepository.softDelete(id);
    await logActivity(userId, 'DELETE', 'Gasto', id);
    return { success: true };
  },

  // ─── Transiciones de estado ───────────────────────────────────────────────

  /**
   * CREADO → ENVIADO_A_JEFE
   * Lo ejecuta el creador (o ADMIN que sigue el mismo flujo).
   */
  async sendToApprovalManager(id: number, userId: number) {
    const gasto = await this.getById(id);
    if (gasto.status !== 'CREADO') {
      throw new HttpError(400, `No se puede enviar a aprobación. Estado actual: ${gasto.status}. Debe ser CREADO.`);
    }

    const updated = await GastoRepository.update(id, { status: 'ENVIADO_A_JEFE' });

    await stateTransitionRepository.create({
      entity: 'Gasto',
      entityId: id,
      fromState: 'CREADO',
      toState: 'ENVIADO_A_JEFE',
      changedById: userId,
    });

    await logActivity(userId, 'SEND_TO_MANAGER', 'Gasto', id, {
      fromState: 'CREADO',
      toState: 'ENVIADO_A_JEFE',
    });

    return updated;
  },

  /**
   * ENVIADO_A_JEFE → ENVIADO_A_CONTABILIDAD
   * Lo ejecuta el MANAGER (o ADMIN siguiendo el mismo flujo).
   */
  async sendToApprovalAccountant(id: number, userId: number) {
    const gasto = await this.getById(id);
    if (gasto.status !== 'ENVIADO_A_JEFE') {
      throw new HttpError(400, `No se puede enviar a contabilidad. Estado actual: ${gasto.status}. Debe ser ENVIADO_A_JEFE.`);
    }

    const updated = await GastoRepository.update(id, { status: 'ENVIADO_A_CONTABILIDAD' });

    await stateTransitionRepository.create({
      entity: 'Gasto',
      entityId: id,
      fromState: 'ENVIADO_A_JEFE',
      toState: 'ENVIADO_A_CONTABILIDAD',
      changedById: userId,
    });

    await logActivity(userId, 'SEND_TO_ACCOUNTANT', 'Gasto', id, {
      fromState: 'ENVIADO_A_JEFE',
      toState: 'ENVIADO_A_CONTABILIDAD',
    });

    return updated;
  },

  /**
   * ENVIADO_A_CONTABILIDAD → LIQUIDADO
   * Solo ACCOUNTANT o ADMIN.
   */
  async liquidate(id: number, userId: number) {
    const gasto = await this.getById(id);
    if (gasto.status !== 'ENVIADO_A_CONTABILIDAD') {
      throw new HttpError(400, `No se puede liquidar. Estado actual: ${gasto.status}. Debe ser ENVIADO_A_CONTABILIDAD.`);
    }

    const updated = await GastoRepository.update(id, { status: 'LIQUIDADO' });

    await stateTransitionRepository.create({
      entity: 'Gasto',
      entityId: id,
      fromState: 'ENVIADO_A_CONTABILIDAD',
      toState: 'LIQUIDADO',
      changedById: userId,
    });

    await logActivity(userId, 'LIQUIDATE', 'Gasto', id, {
      fromState: 'ENVIADO_A_CONTABILIDAD',
      toState: 'LIQUIDADO',
    });

    return updated;
  },

  /**
   * Cualquier estado activo → RECHAZADO
   * Solo ACCOUNTANT o ADMIN (validado por middleware de permisos).
   */
  async reject(id: number, userId: number, reason?: string) {
    const gasto = await this.getById(id);
    const allowedStates = ['ENVIADO_A_JEFE', 'ENVIADO_A_CONTABILIDAD'];
    if (!allowedStates.includes(gasto.status)) {
      throw new HttpError(400, `No se puede rechazar. Estado actual: ${gasto.status}. Solo se puede rechazar en estados: ${allowedStates.join(', ')}.`);
    }

    const fromState = gasto.status;
    const updated = await GastoRepository.update(id, { status: 'RECHAZADO' });

    await stateTransitionRepository.create({
      entity: 'Gasto',
      entityId: id,
      fromState,
      toState: 'RECHAZADO',
      changedById: userId,
    });

    await logActivity(userId, 'REJECT', 'Gasto', id, {
      fromState,
      toState: 'RECHAZADO',
      reason: reason ?? null,
    });

    return updated;
  },

  // ─── Utilidades ───────────────────────────────────────────────────────────

  /** Calcula la ficha de liquidación para una legalización. */
  async getFichaLiquidacion(legalizacionId: number) {
    const gastos = await GastoRepository.findAll({ legalizacionId });
    const { total } = await GastoRepository.sumByLegalizacion(legalizacionId);

    const detalleFacturas = gastos.map((g, i) => ({
      n: i + 1,
      fechaGasto: g.createdAt.toISOString().split('T')[0],
      concepto: g.description ?? 'Sin descripción',
      proveedor: '-',
      nFactura: g.tipo === 'FACTURA' ? `G-${g.id}` : '-',
      valor: g.amount,
    }));

    return {
      anticipoAprobado: 0,
      gastosLiquidados: total,
      saldo: -total,
      detalleFacturas,
    };
  },
};
