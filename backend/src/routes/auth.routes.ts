import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const registerAuthRoutes = (app: FastifyInstance) => {
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      description: 'Register a new user',
      security: [],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' }
        }
      }
    }
  }, AuthController.register);

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      description: 'Login with email and password',
      security: [],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, AuthController.login);

  app.get('/me', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Auth'],
      description: 'Get current user profile',
      security: [{ bearerAuth: [] }]
    }
  }, AuthController.me);

  app.patch('/password', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Auth'],
      description: 'Change current user password',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['actual', 'nueva'],
        properties: {
          actual: { type: 'string' },
          nueva: { type: 'string', minLength: 6 }
        }
      }
    }
  }, AuthController.changePassword);
};

