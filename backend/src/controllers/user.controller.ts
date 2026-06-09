import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service.js';
import { z } from 'zod';

const updateUserSchema = z.object({
  roleId: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const UserController = {
  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    const result = await UserService.getAllUsers();
    return reply.send(result);
  },

  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = updateUserSchema.parse(request.body);
    
    const updateData: any = {};
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.isActive !== undefined) {
      updateData.deletedAt = data.isActive ? null : new Date();
    }

    const result = await UserService.updateUser(Number(id), updateData);
    return reply.send(result);
  },

  async getAllRoles(request: FastifyRequest, reply: FastifyReply) {
    const result = await UserService.getAllRoles();
    return reply.send(result);
  }
};
