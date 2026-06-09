import { FastifyReply, FastifyRequest } from 'fastify';
import { GastoService } from '../services/gasto.service.js';
import { createGastoSchema, updateGastoSchema } from '../validators/gasto.validator.js';
import { AuthenticatedRequest, IdParams } from '../types/request.types.js';

export const GastoController = {
  /** GET /api/v1/gastos?legalizacionId=X&createdById=Y */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      legalizacionId?: string;
      createdById?: string;
      skip?: string;
      take?: string;
    };
    const authReq = request as AuthenticatedRequest;

    const roleName = authReq.user.role.name;
    const isAdmin = roleName === 'ADMIN';
    const isManager = roleName === 'MANAGER';
    const isAccountant = roleName === 'ACCOUNTANT';

    let orConditions: any[] | undefined = undefined;
    let createdById: number | undefined = undefined;

    if (query.legalizacionId) {
      if (!isAdmin && !isManager && !isAccountant) {
        createdById = authReq.user.id;
      }
    } else {
      if (isAdmin) {
        // Admin sees all
      } else if (isManager) {
        orConditions = [
          { createdById: authReq.user.id },
          { status: 'ENVIADO_A_JEFE' },
          { status: 'ENVIADO_A_CONTABILIDAD' },
          { status: 'LIQUIDADO' },
          { status: 'RECHAZADO' }
        ];
      } else if (isAccountant) {
        orConditions = [
          { createdById: authReq.user.id },
          { status: 'ENVIADO_A_CONTABILIDAD' },
          { status: 'LIQUIDADO' },
          { status: 'RECHAZADO' }
        ];
      } else {
        createdById = authReq.user.id;
      }
    }

    const items = await GastoService.getAll({
      legalizacionId: query.legalizacionId ? Number(query.legalizacionId) : undefined,
      createdById: query.createdById ? Number(query.createdById) : createdById,
      orConditions,
      skip: query.skip ? Number(query.skip) : undefined,
      take: query.take ? Number(query.take) : undefined,
    });
    return reply.send(items);
  },

  /** GET /api/v1/gastos/:id */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const item = await GastoService.getById(Number(id));
    return reply.send(item);
  },

  /** POST /api/v1/gastos */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const data = createGastoSchema.parse(request.body);
    const item = await GastoService.create(data, authReq.user.id);
    return reply.code(201).send(item);
  },

  /** PATCH /api/v1/gastos/:id */
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = updateGastoSchema.parse(request.body);
    const item = await GastoService.update(Number(id), data, authReq.user.id);
    return reply.send(item);
  },

  /** DELETE /api/v1/gastos/:id */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    await GastoService.softDelete(Number(id), authReq.user.id);
    return reply.code(204).send();
  },

  // ─── Transiciones de estado ─────────────────────────────────────────────

  /** POST /api/v1/gastos/:id/send-to-manager  (CREADO → ENVIADO_A_JEFE) */
  async sendToManager(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await GastoService.sendToApprovalManager(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** POST /api/v1/gastos/:id/send-to-accountant  (ENVIADO_A_JEFE → ENVIADO_A_CONTABILIDAD) */
  async sendToAccountant(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await GastoService.sendToApprovalAccountant(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** POST /api/v1/gastos/:id/liquidate  (ENVIADO_A_CONTABILIDAD → LIQUIDADO) */
  async liquidate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await GastoService.liquidate(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** POST /api/v1/gastos/:id/reject  (activo → RECHAZADO) */
  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const { reason } = (request.body ?? {}) as { reason?: string };
    const item = await GastoService.reject(Number(id), authReq.user.id, reason);
    return reply.send(item);
  },

  /** GET /api/v1/gastos/liquidacion/:legalizacionId */
  async getFichaLiquidacion(request: FastifyRequest, reply: FastifyReply) {
    const { legalizacionId } = request.params as { legalizacionId: string };
    const ficha = await GastoService.getFichaLiquidacion(Number(legalizacionId));
    return reply.send(ficha);
  },
};
