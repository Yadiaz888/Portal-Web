import { FastifyInstance } from 'fastify';
import { ViaticoController } from '../controllers/viatico.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';

const idParam = {
  type: 'object',
  properties: { id: { type: 'string', description: 'Viatico ID' } },
  required: ['id'],
};

export const registerViaticoRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/', {
    preHandler: [requirePermission('read', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'List all viáticos',
      security: [{ bearerAuth: [] }],
    },
  }, ViaticoController.getAll);

  app.get('/:id', {
    preHandler: [requirePermission('read', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Get a viático by ID',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.getById);

  app.post('/', {
    preHandler: [requirePermission('create', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Create a new viático',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['description', 'amount'],
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
          destination: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, ViaticoController.create);

  app.patch('/:id/approve', {
    preHandler: [requirePermission('approve', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Approve a viático',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.approve);

  app.patch('/:id/approve-accountant', {
    preHandler: [requirePermission('approve_accountant', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Approve viático (Accountant step)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.approveAccountant);

  app.patch('/:id/reject', {
    preHandler: [requirePermission('reject', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Reject a viático',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.reject);

  app.patch('/:id/cancel', {
    preHandler: [requirePermission('cancel', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Cancel a viático',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.cancel);

  app.patch('/:id/complete', {
    preHandler: [requirePermission('complete', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Mark a viático as completed',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.complete);

  app.patch('/:id/pay', {
    preHandler: [requirePermission('pay', 'viatico')],
    schema: {
      tags: ['Viaticos'],
      description: 'Mark a viatico as paid after payment gateway validation',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.pay);

  app.delete('/:id', {
    preHandler: [requirePermission('delete', 'viatico')],
    schema: {
      tags: ['Viáticos'],
      description: 'Delete a viático',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, ViaticoController.delete);
};
