import { FastifyReply, FastifyRequest } from 'fastify';
import { facturaService } from '../services/factura.service.js';
import { createFacturaSchema } from '../validators/factura.validator.js';
import { AuthenticatedRequest, IdParams, ListFiltersQuery } from '../types/request.types.js';
import { buildScopedListFilters } from '../services/listScope.service.js';

export const FacturaController = {
  /** GET /api/v1/facturas */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListFiltersQuery;
    const filters = buildScopedListFilters(request as AuthenticatedRequest, query);

    const data = await facturaService.getAll(filters);
    return reply.send(data);
  },

  /** GET /api/v1/facturas/:id */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const data = await facturaService.getById(Number(id));
    return reply.send(data);
  },

  /** POST /api/v1/facturas */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const data = createFacturaSchema.parse(request.body);
    const factura = await facturaService.create(data, authReq.user.id);
    return reply.code(201).send(factura);
  },

  /** PATCH /api/v1/facturas/:id/approve */
  async approve(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = await facturaService.approve(Number(id), authReq.user.id);
    return reply.send(data);
  },

  /** PATCH /api/v1/facturas/:id/approve-accountant */
  async approveAccountant(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = await facturaService.approveAccountant(Number(id), authReq.user.id);
    return reply.send(data);
  },

  /** PATCH /api/v1/facturas/:id/reject */
  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = await facturaService.reject(Number(id), authReq.user.id);
    return reply.send(data);
  },

  /** PATCH /api/v1/facturas/:id/cancel */
  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = await facturaService.cancel(Number(id), authReq.user.id);
    return reply.send(data);
  },

  /** PATCH /api/v1/facturas/:id/complete */
  async complete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = await facturaService.complete(Number(id), authReq.user.id);
    return reply.send(data);
  },

  /** PATCH /api/v1/facturas/:id/pay */
  async pay(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const authReq = request as AuthenticatedRequest;
    const data = await facturaService.pay(Number(id), authReq.user.id);
    return reply.send(data);
  },

  /** DELETE /api/v1/facturas/:id */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    await facturaService.softDelete(Number(id));
    return reply.code(204).send();
  }
};
