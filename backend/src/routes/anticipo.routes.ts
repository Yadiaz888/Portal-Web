import { FastifyInstance } from 'fastify';
import { AnticipoController } from '../controllers/anticipo.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';

const idParam = {
  type: 'object',
  properties: { id: { type: 'string', description: 'Anticipo ID' } },
  required: ['id'],
};

export const registerAnticipoRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/', {
    preHandler: [requirePermission('read', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'List all anticipos',
      security: [{ bearerAuth: [] }],
    },
  }, AnticipoController.getAll);

  app.get('/:id', {
    preHandler: [requirePermission('read', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Get an anticipo by ID',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.getById);

  app.post('/', {
    preHandler: [requirePermission('create', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Create a new anticipo',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string', default: 'COP' },
          description: { type: 'string' },
        },
      },
    },
  }, AnticipoController.create);

  /** Paso 1: Aprobación del Jefe Inmediato (MANAGER) */
  app.patch('/:id/approve', {
    preHandler: [requirePermission('approve', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Approve anticipo (Manager step)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.approve);

  /** Paso 2: Aprobación de Contabilidad (ACCOUNTANT) */
  app.patch('/:id/approve-accountant', {
    preHandler: [requirePermission('approve_accountant', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Approve anticipo (Accountant step)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.approveAccountant);

  /** Paso 3: Marcar como pagado/completado */
  app.patch('/:id/complete', {
    preHandler: [requirePermission('complete', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Mark anticipo as completed (paid)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.complete);

  /** Paso 4: Confirmacion de pasarela de pagos */
  app.patch('/:id/pay', {
    preHandler: [requirePermission('pay', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Mark anticipo as paid after payment gateway validation',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.pay);

  app.patch('/:id/reject', {
    preHandler: [requirePermission('reject', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Reject an anticipo',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.reject);

  app.patch('/:id/cancel', {
    preHandler: [requirePermission('cancel', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Cancel an anticipo',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.cancel);

  app.delete('/:id', {
    preHandler: [requirePermission('delete', 'anticipo')],
    schema: {
      tags: ['Anticipos'],
      description: 'Delete an anticipo',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, AnticipoController.delete);
};
