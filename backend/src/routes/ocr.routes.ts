import { FastifyInstance } from 'fastify';
import { OcrController } from '../controllers/ocr.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const registerOcrRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.post('/extract', {
    schema: {
      tags: ['OCR'],
      description: 'Extrae datos de una imagen (JPG/PNG) usando IA gratuita',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
  }, OcrController.extractData);
};
