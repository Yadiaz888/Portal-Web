import { FastifyRequest } from 'fastify';

/**
 * Extiende FastifyRequest para incluir el usuario autenticado.
 * Esto se inyecta en el middleware de autenticación (auth.middleware.ts).
 * Usar este tipo en los controladores evita casteos con `as any`.
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
    name: string | null;
    roleId: number;
    role: {
      id: number;
      name: string;
    };
  };
}

/**
 * Parámetros comunes para endpoints que reciben un :id en la URL.
 */
export interface IdParams {
  id: string;
}

/**
 * Query params comunes para listar entidades con filtros de estado y creador.
 */
export interface ListFiltersQuery {
  status?: string;
  createdById?: string;
}
