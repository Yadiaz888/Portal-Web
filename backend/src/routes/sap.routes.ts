import { FastifyInstance } from 'fastify';
import { SapController } from '../controllers/sap.controller.js';
import { XmlController } from '../controllers/xml.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const registerSapRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/facturas', {
    schema: {
      tags: ['SAP'],
      description: 'Busca facturas en SAP por NIT y/o Fecha de Emisión',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          nit: { type: 'string' },
          fechaEmision: { type: 'string' },
        },
      },
    },
  }, SapController.searchFacturas);

  app.post('/xml', {
    schema: {
      tags: ['SAP', 'XML'],
      description: 'Lee y extrae datos de un archivo XML (UBL 2.1) de factura electrónica',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
  }, XmlController.extractData);
};

