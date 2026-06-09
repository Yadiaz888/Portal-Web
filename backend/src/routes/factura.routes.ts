import { FastifyInstance } from 'fastify';
import { FacturaController } from '../controllers/factura.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';

const idParam = {
  type: 'object',
  properties: { id: { type: 'string', description: 'Factura ID' } },
  required: ['id'],
};

export const registerFacturaRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/', {
    preHandler: [requirePermission('read', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'List all facturas',
      security: [{ bearerAuth: [] }],
    },
  }, FacturaController.getAll);

  app.get('/:id', {
    preHandler: [requirePermission('read', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Get a factura by ID',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.getById);

  app.post('/', {
    preHandler: [requirePermission('create', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Create a new factura',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string', default: 'COP' },
          description: { type: 'string' },
          vendor: { type: 'string' },
          invoiceNumber: { type: 'string' },
        },
      },
    },
  }, FacturaController.create);

  app.patch('/:id/approve', {
    preHandler: [requirePermission('approve', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Approve a factura',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.approve);

  app.patch('/:id/approve-accountant', {
    preHandler: [requirePermission('approve_accountant', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Approve factura (Accountant step)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.approveAccountant);

  app.patch('/:id/reject', {
    preHandler: [requirePermission('reject', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Reject a factura',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.reject);

  app.patch('/:id/cancel', {
    preHandler: [requirePermission('cancel', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Cancel a factura',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.cancel);

  app.patch('/:id/complete', {
    preHandler: [requirePermission('complete', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Mark a factura as completed',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.complete);

  app.patch('/:id/pay', {
    preHandler: [requirePermission('pay', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Mark a factura as paid after payment gateway validation',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.pay);

  app.delete('/:id', {
    preHandler: [requirePermission('delete', 'factura')],
    schema: {
      tags: ['Facturas'],
      description: 'Delete a factura',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, FacturaController.delete);
};
