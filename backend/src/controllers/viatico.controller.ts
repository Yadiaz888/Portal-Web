import { FastifyReply, FastifyRequest } from 'fastify';
import { viaticoService } from '../services/viatico.service.js';
import { createViaticoSchema } from '../validators/viatico.validator.js';
import { AuthenticatedRequest, IdParams, ListFiltersQuery } from '../types/request.types.js';
import { buildScopedListFilters } from '../services/listScope.service.js';

export const ViaticoController = {
  /** GET /api/v1/viaticos */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListFiltersQuery;
    const filters = buildScopedListFilters(request as AuthenticatedRequest, query);

    const viaticos = await viaticoService.getAll(filters);
    return reply.send(viaticos);
  },

  /** GET /api/v1/viaticos/:id */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const viatico = await viaticoService.getById(Number(id));
    return reply.send(viatico);
  },

  /** POST /api/v1/viaticos */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const data = createViaticoSchema.parse(request.body);
    const viatico = await viaticoService.create(data, authReq.user.id);
    return reply.code(201).send(viatico);
  },

  /** PATCH /api/v1/viaticos/:id/approve */
  async approve(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const viatico = await viaticoService.approve(Number(id), authReq.user.id);
    return reply.send(viatico);
  },

  /** PATCH /api/v1/viaticos/:id/approve-accountant */
  async approveAccountant(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const viatico = await viaticoService.approveAccountant(Number(id), authReq.user.id);
    return reply.send(viatico);
  },

  /** PATCH /api/v1/viaticos/:id/reject */
  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const viatico = await viaticoService.reject(Number(id), authReq.user.id);
    return reply.send(viatico);
  },

  /** PATCH /api/v1/viaticos/:id/cancel */
  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const viatico = await viaticoService.cancel(Number(id), authReq.user.id);
    return reply.send(viatico);
  },

  /** PATCH /api/v1/viaticos/:id/complete */
  async complete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const viatico = await viaticoService.complete(Number(id), authReq.user.id);
    return reply.send(viatico);
  },

  /** PATCH /api/v1/viaticos/:id/pay */
  async pay(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const viatico = await viaticoService.pay(Number(id), authReq.user.id);
    return reply.send(viatico);
  },

  /** DELETE /api/v1/viaticos/:id */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    await viaticoService.softDelete(Number(id));
    return reply.code(204).send();
  }
};
