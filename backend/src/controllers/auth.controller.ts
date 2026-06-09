import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator.js';
import { AuthenticatedRequest } from '../types/request.types.js';

export const AuthController = {
  /**
   * POST /auth/register
   * Registra un nuevo usuario en el sistema.
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    const data = registerSchema.parse(request.body);
    const result = await AuthService.register(data);
    return reply.code(201).send(result);
  },

  /**
   * POST /auth/login
   * Autentica un usuario y devuelve un token JWT.
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);
    const result = await AuthService.login(data);
    return reply.send(result);
  },

  /**
   * GET /auth/me
   * Retorna los datos y permisos del usuario autenticado actual.
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const result = await AuthService.getMe(authReq.user.id);
    return reply.send(result);
  },

  /**
   * PATCH /auth/password
   * Cambia la contraseña del usuario actual.
   */
  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const data = changePasswordSchema.parse(request.body);
    const result = await AuthService.changePassword(authReq.user.id, data);
    return reply.send(result);
  }
};
