import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { AuthenticatedRequest } from '../types/request.types.js';
import { FastifyReply, FastifyRequest } from 'fastify';

const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const req = request as AuthenticatedRequest;
  if (req.user.role.name !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acceso denegado. Se requiere rol ADMIN.' });
  }
};

export const registerUserRoutes = (app: FastifyInstance) => {
  // Only ADMIN can manage users and roles in this context
  app.addHook('preHandler', authMiddleware);
  app.addHook('preHandler', requireAdmin);
  
  app.get('/', {
    schema: { tags: ['Users'], security: [{ bearerAuth: [] }] }
  }, UserController.getAllUsers);

  app.patch('/:id', {
    schema: { 
      tags: ['Users'], 
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          roleId: { type: 'number' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, UserController.updateUser);

  app.get('/roles', {
    schema: { tags: ['Roles'], security: [{ bearerAuth: [] }] }
  }, UserController.getAllRoles);
};
