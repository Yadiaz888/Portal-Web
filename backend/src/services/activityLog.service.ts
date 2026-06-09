import { prisma } from '../lib/prisma.js';

export async function logActivity(
  userId: number,
  action: string,
  entity: string,
  entityId?: number,
  details?: Record<string, unknown>
) {
  return prisma.activityLog.create({
    data: {
      userId,
      action,
      entity,
      entityId: entityId ?? null,
      details: details ? JSON.stringify(details) : null,
    },
  });
}

export async function getActivityLogs(filters?: { userId?: number; entity?: string; limit?: number }) {
  return prisma.activityLog.findMany({
    where: {
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.entity && { entity: filters.entity }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { timestamp: 'desc' },
    take: filters?.limit ?? 50,
  });
}
