import { FastifyRequest, FastifyReply } from 'fastify';
import { SapService } from '../services/sap.service.js';

export const SapController = {
  async searchFacturas(request: FastifyRequest, reply: FastifyReply) {
    const { nit, dateFrom, dateTo } = request.query as {
      nit?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    const facturas = await SapService.searchFacturas({ nit, dateFrom, dateTo });
    return reply.send({ data: facturas });
  },

  async getFacturaDocumentos(request: FastifyRequest, reply: FastifyReply) {
    const { globalDocumentId } = request.params as { globalDocumentId: string };
    const factura = await SapService.getFacturaConDocumentos(globalDocumentId);
    if (!factura) {
      return reply.status(404).send({ message: 'Factura no encontrada' });
    }
    return reply.send({ data: factura });
  },

  async getFacturaPdf(request: FastifyRequest, reply: FastifyReply) {
    const { globalDocumentId } = request.params as { globalDocumentId: string };
    const result = await SapService.getFacturaPdf(globalDocumentId);
    if (!result?.pdfBase64) {
      return reply.status(404).send({ message: 'PDF no encontrado para esta factura' });
    }
    const cleanBase64 = result.pdfBase64.replace(/[\s\r\n]+/g, '');
    const pdfBuffer = Buffer.from(cleanBase64, 'base64');
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'inline')
      .send(pdfBuffer);
  },
};
