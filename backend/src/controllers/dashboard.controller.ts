import { FastifyReply, FastifyRequest } from 'fastify';
import { dashboardService } from '../services/dashboard.service.js';
import { AuthenticatedRequest } from '../types/request.types.js';

export const DashboardController = {
  async getHome(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const dashboard = await dashboardService.getHome(authReq.user.id, authReq.user.role?.name);
    return reply.send(dashboard);
  },
};
