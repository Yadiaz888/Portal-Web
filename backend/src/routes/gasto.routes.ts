import { FastifyInstance } from 'fastify';
import { GastoController } from '../controllers/gasto.controller.js';
import { UploadController } from '../controllers/upload.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';

const idParam = {
  type: 'object',
  properties: { id: { type: 'string', description: 'Gasto ID' } },
  required: ['id'],
};

const legalizacionIdParam = {
  type: 'object',
  properties: { legalizacionId: { type: 'string', description: 'Legalizacion ID' } },
  required: ['legalizacionId'],
};

export const registerGastoRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  // ─── Listado y detalle ──────────────────────────────────────────────────

  app.get('/', {
    preHandler: [requirePermission('read', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Lista todos los gastos (filtrar por legalizacionId o createdById)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          legalizacionId: { type: 'string' },
          createdById: { type: 'string' },
          skip: { type: 'string' },
          take: { type: 'string' },
        },
      },
    },
  }, GastoController.getAll);

  app.get('/liquidacion/:legalizacionId', {
    preHandler: [requirePermission('read', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Ficha de liquidación para una legalización',
      security: [{ bearerAuth: [] }],
      params: legalizacionIdParam,
    },
  }, GastoController.getFichaLiquidacion);

  app.get('/:id', {
    preHandler: [requirePermission('read', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Obtiene un gasto por ID',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, GastoController.getById);

  // ─── Crear y editar ─────────────────────────────────────────────────────

  app.post('/', {
    preHandler: [requirePermission('create', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Crea un nuevo gasto (queda en estado CREADO)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['amount', 'tipo'],
        additionalProperties: false,
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
          description: { type: 'string' },
          tipo: { type: 'string', enum: ['RECIBO', 'FACTURA', 'OTRO'] },
          origen: { type: 'string', enum: ['MANUAL', 'ELECTRONICA', 'NO_ELECTRONICA'] },
          legalizacionId: { type: 'number' },
          nitProveedor: { type: 'string' },
          razonSocial: { type: 'string' },
          numeroFactura: { type: 'string' },
          fechaEmision: { type: 'string' },
          subtotal: { type: 'number' },
          iva: { type: 'number' },
          sapDocId: { type: 'string' },
          ocrConfidence: { type: 'number' },
        },
      },
    },
  }, GastoController.create);

  app.patch('/:id', {
    preHandler: [requirePermission('update', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Actualiza un gasto (solo si está en estado CREADO)',
      security: [{ bearerAuth: [] }],
      params: idParam,
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
          description: { type: 'string' },
          tipo: { type: 'string', enum: ['RECIBO', 'FACTURA', 'OTRO'] },
        },
      },
    },
  }, GastoController.update);

  app.delete('/:id', {
    preHandler: [requirePermission('delete', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Elimina un gasto (soft delete)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, GastoController.delete);

  // ─── Transiciones de estado ─────────────────────────────────────────────

  /**
   * CREADO → ENVIADO_A_JEFE
   * Quién: el creador (USER) o ADMIN siguiendo el mismo flujo.
   * Permiso: send_to_approval_manager sobre gasto.
   */
  app.post('/:id/send-to-manager', {
    preHandler: [requirePermission('send_to_approval_manager', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Envía el gasto a aprobación del jefe (CREADO → ENVIADO_A_JEFE)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, GastoController.sendToManager);

  /**
   * ENVIADO_A_JEFE → ENVIADO_A_CONTABILIDAD
   * Quién: MANAGER o ADMIN siguiendo el mismo flujo.
   * Permiso: send_to_approval_accountant sobre gasto.
   */
  app.post('/:id/send-to-accountant', {
    preHandler: [requirePermission('send_to_approval_accountant', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Envía el gasto a contabilidad (ENVIADO_A_JEFE → ENVIADO_A_CONTABILIDAD)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, GastoController.sendToAccountant);

  /**
   * ENVIADO_A_CONTABILIDAD → LIQUIDADO
   * Quién: ACCOUNTANT o ADMIN.
   * Permiso: liquidate sobre gasto.
   */
  app.post('/:id/liquidate', {
    preHandler: [requirePermission('liquidate', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Aprueba y liquida el gasto (ENVIADO_A_CONTABILIDAD → LIQUIDADO)',
      security: [{ bearerAuth: [] }],
      params: idParam,
    },
  }, GastoController.liquidate);

  /**
   * Cualquier estado activo → RECHAZADO
   * Quién: ACCOUNTANT o ADMIN.
   * Permiso: reject sobre gasto.
   */
  app.post('/:id/reject', {
    preHandler: [requirePermission('reject', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Rechaza el gasto (solo ACCOUNTANT/ADMIN)',
      security: [{ bearerAuth: [] }],
      params: idParam,
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Motivo del rechazo (opcional)' },
        },
      },
    },
  }, GastoController.reject);

  // ─── Archivos de soporte ────────────────────────────────────────────────

  app.post('/:gastoId/archivos', {
    preHandler: [requirePermission('create', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Carga un archivo de soporte para un gasto',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
  }, UploadController.uploadGastoArchivo);

  app.get('/:gastoId/archivos', {
    preHandler: [requirePermission('read', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Lista los archivos de un gasto',
      security: [{ bearerAuth: [] }],
    },
  }, UploadController.listGastoArchivos);

  app.get('/:gastoId/archivos/:archivoId/download', {
    preHandler: [requirePermission('read', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Descarga un archivo de gasto',
      security: [{ bearerAuth: [] }],
    },
  }, UploadController.downloadGastoArchivo);

  app.delete('/:gastoId/archivos/:archivoId', {
    preHandler: [requirePermission('delete', 'gasto')],
    schema: {
      tags: ['Gastos'],
      description: 'Elimina un archivo de gasto',
      security: [{ bearerAuth: [] }],
    },
  }, UploadController.deleteGastoArchivo);
};
