import { FastifyReply, FastifyRequest } from 'fastify';
import { anticipoService } from '../services/anticipo.service.js';
import { createAnticipoSchema } from '../validators/anticipo.validator.js';
import { AuthenticatedRequest, IdParams, ListFiltersQuery } from '../types/request.types.js';
import { buildScopedListFilters } from '../services/listScope.service.js';

export const AnticipoController = {
  /** GET /api/v1/anticipos */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListFiltersQuery;
    const filters = buildScopedListFilters(request as AuthenticatedRequest, query);

    const anticipos = await anticipoService.getAll(filters);
    return reply.send(anticipos);
  },

  /** GET /api/v1/anticipos/:id */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const anticipo = await anticipoService.getById(Number(id));
    return reply.send(anticipo);
  },

  /** POST /api/v1/anticipos */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const data = createAnticipoSchema.parse(request.body);
    const anticipo = await anticipoService.create(data, authReq.user.id);
    return reply.code(201).send(anticipo);
  },

  /** PATCH /api/v1/anticipos/:id/approve — Jefe Inmediato */
  async approve(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const anticipo = await anticipoService.approve(Number(id), authReq.user.id);
    return reply.send(anticipo);
  },

  /** PATCH /api/v1/anticipos/:id/approve-accountant — Contabilidad */
  async approveAccountant(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const anticipo = await anticipoService.approveAccountant(Number(id), authReq.user.id);
    return reply.send(anticipo);
  },

  /** PATCH /api/v1/anticipos/:id/reject */
  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const anticipo = await anticipoService.reject(Number(id), authReq.user.id);
    return reply.send(anticipo);
  },

  /** PATCH /api/v1/anticipos/:id/cancel */
  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const anticipo = await anticipoService.cancel(Number(id), authReq.user.id);
    return reply.send(anticipo);
  },

  /** PATCH /api/v1/anticipos/:id/complete — Pago */
  async complete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const anticipo = await anticipoService.complete(Number(id), authReq.user.id);
    return reply.send(anticipo);
  },

  /** PATCH /api/v1/anticipos/:id/pay — respuesta OK de pasarela simulada */
  async pay(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const anticipo = await anticipoService.pay(Number(id), authReq.user.id);
    return reply.send(anticipo);
  },

  /** DELETE /api/v1/anticipos/:id */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    await anticipoService.softDelete(Number(id));
    return reply.code(204).send();
  }
};
