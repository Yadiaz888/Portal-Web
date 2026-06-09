import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload: any = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });
    if (!user) {
      reply.code(401).send({ error: 'User not found' });
      return;
    }
    (request as any).user = user;
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token' });
  }
}
