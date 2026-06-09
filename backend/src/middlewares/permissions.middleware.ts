import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../errors/httpError.js';

export function requirePermission(action: string, resource: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      throw new HttpError(401, 'No autenticado');
    }

    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new HttpError(403, 'Rol no encontrado');
    }

    if (role.name === 'ADMIN') {
      return;
    }

    const hasPermission = role.permissions.some(
      (rp) => rp.permission.action === action && rp.permission.resource === resource
    );

    if (!hasPermission) {
      throw new HttpError(403, 'No tienes permisos para realizar esta acción');
    }
  };
}
