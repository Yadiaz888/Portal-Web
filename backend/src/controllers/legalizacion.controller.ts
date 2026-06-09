import { FastifyReply, FastifyRequest } from 'fastify';
import { LegalizacionService } from '../services/legalizacion.service.js';
import { createLegalizacionSchema } from '../validators/legalizacion.validator.js';
import { AuthenticatedRequest, IdParams, ListFiltersQuery } from '../types/request.types.js';
import { buildScopedListFilters } from '../services/listScope.service.js';

export const LegalizacionController = {
  /** GET /api/v1/legalizaciones */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListFiltersQuery;
    const filters = buildScopedListFilters(request as AuthenticatedRequest, query);

    const items = await LegalizacionService.getAll(filters);
    return reply.send(items);
  },

  /** GET /api/v1/legalizaciones/:id */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const item = await LegalizacionService.getById(Number(id));
    return reply.send(item);
  },

  /** POST /api/v1/legalizaciones */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const data = createLegalizacionSchema.parse(request.body);
    const item = await LegalizacionService.create({ ...data, createdById: authReq.user.id });
    return reply.code(201).send(item);
  },

  /** PATCH /api/v1/legalizaciones/:id/approve */
  async approve(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await LegalizacionService.approve(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** PATCH /api/v1/legalizaciones/:id/approve-accountant */
  async approveAccountant(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await LegalizacionService.approveAccountant(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** PATCH /api/v1/legalizaciones/:id/reject */
  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await LegalizacionService.reject(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** PATCH /api/v1/legalizaciones/:id/cancel */
  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await LegalizacionService.cancel(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** PATCH /api/v1/legalizaciones/:id/complete */
  async complete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await LegalizacionService.complete(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** PATCH /api/v1/legalizaciones/:id/pay */
  async pay(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const item = await LegalizacionService.pay(Number(id), authReq.user.id);
    return reply.send(item);
  },

  /** DELETE /api/v1/legalizaciones/:id */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    await LegalizacionService.softDelete(Number(id), authReq.user.id);
    return reply.code(204).send();
  }
};
