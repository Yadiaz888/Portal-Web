import { FastifyInstance } from 'fastify';
import { LegalizacionController } from '../controllers/legalizacion.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';

const idParam = {
  type: 'object',
  properties: { id: { type: 'string', description: 'Legalizacion ID' } },
  required: ['id'],
};

export const registerLegalizacionRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/', {
    preHandler: [requirePermission('read', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'List all legalizaciones',
      security: [{ bearerAuth: [] }],
    },
  }, LegalizacionController.getAll);

  app.get('/:id', {
    preHandler: [requirePermission('read', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Get a legalización by ID',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.getById);

  app.post('/', {
    preHandler: [requirePermission('create', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Create a new legalización',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['description', 'amount'],
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    },
  }, LegalizacionController.create);

  app.patch('/:id/approve', {
    preHandler: [requirePermission('approve', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Approve a legalización',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.approve);

  app.patch('/:id/approve-accountant', {
    preHandler: [requirePermission('approve_accountant', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Approve legalización (Accountant step)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.approveAccountant);

  app.patch('/:id/reject', {
    preHandler: [requirePermission('reject', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Reject a legalización',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.reject);

  app.patch('/:id/cancel', {
    preHandler: [requirePermission('cancel', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Cancel a legalización',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.cancel);

  app.patch('/:id/complete', {
    preHandler: [requirePermission('complete', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Mark a legalización as completed',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.complete);

  app.patch('/:id/pay', {
    preHandler: [requirePermission('pay', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Mark a legalizacion as paid after payment gateway validation',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.pay);

  app.delete('/:id', {
    preHandler: [requirePermission('delete', 'legalizacion')],
    schema: {
      tags: ['Legalizaciones'],
      description: 'Delete a legalización',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, LegalizacionController.delete);
};
