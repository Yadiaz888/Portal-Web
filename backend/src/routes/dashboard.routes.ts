import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const registerDashboardRoutes = (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  app.get('/home', {
    schema: {
      tags: ['Dashboard'],
      description: 'Dashboard data for the authenticated user home page',
      security: [{ bearerAuth: [] }],
    },
  }, DashboardController.getHome);
};
