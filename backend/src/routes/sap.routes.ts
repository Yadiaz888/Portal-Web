import { FastifyInstance } from 'fastify';
import { SapController } from '../controllers/sap.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const registerSapRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/facturas', {
    schema: {
      tags: ['SAP (Mock)'],
      description: 'Busca una factura en SAP por NIT (Simulación)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          nit: { type: 'string' },
        },
        required: ['nit'],
      },
    },
  }, SapController.searchFacturas);
};
