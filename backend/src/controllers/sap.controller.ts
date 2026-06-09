import { FastifyRequest, FastifyReply } from 'fastify';
import { SapService } from '../services/sap.service.js';

export const SapController = {
  /**
   * GET /api/v1/sap/facturas?nit=...
   */
  async searchFacturas(request: FastifyRequest, reply: FastifyReply) {
    const { nit } = request.query as { nit?: string };

    if (!nit) {
      return reply.code(400).send({ message: 'Se requiere el parámetro "nit" para buscar en SAP.' });
    }

    const factura = await SapService.getFacturaByNit(nit);
    return reply.send({ data: factura });
  }
};
