import { FastifyRequest, FastifyReply } from 'fastify';
import { SapService } from '../services/sap.service.js';

export const SapController = {
  /**
   * GET /api/v1/sap/facturas?nit=...&fechaEmision=...
   */
  async searchFacturas(request: FastifyRequest, reply: FastifyReply) {
    const { nit, fechaEmision } = request.query as { nit?: string, fechaEmision?: string };

    const facturas = await SapService.searchFacturas(nit, fechaEmision);
    return reply.send({ data: facturas });
  }
};
