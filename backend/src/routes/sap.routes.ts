import { FastifyInstance } from 'fastify';
import { SapController } from '../controllers/sap.controller.js';
import { XmlController } from '../controllers/xml.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const registerSapRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/facturas', {
    schema: {
      tags: ['SAP'],
      description: 'Busca facturas electrónicas por NIT y/o rango de fechas',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          nit:      { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo:   { type: 'string' },
        },
      },
    },
  }, SapController.searchFacturas);

  app.get('/facturas/:globalDocumentId', {
    schema: {
      tags: ['SAP'],
      description: 'Obtiene PDF y XML de una factura por GlobalDocumentId',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          globalDocumentId: { type: 'string' },
        },
        required: ['globalDocumentId'],
      },
    },
  }, SapController.getFacturaDocumentos);

  app.get('/facturas/:globalDocumentId/pdf', {
    schema: {
      tags: ['SAP'],
      description: 'Sirve el PDF binario de una factura electrónica',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          globalDocumentId: { type: 'string' },
        },
        required: ['globalDocumentId'],
      },
    },
  }, SapController.getFacturaPdf);

  app.post('/xml', {
    schema: {
      tags: ['SAP', 'XML'],
      description: 'Lee y extrae datos de un archivo XML (UBL 2.1) de factura electrónica',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
  }, XmlController.extractData);
};
