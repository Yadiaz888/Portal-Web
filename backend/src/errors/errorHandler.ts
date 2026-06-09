import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { HttpError } from './httpError.js';
import { ZodError } from 'zod';

export const errorHandler = (error: FastifyError | HttpError | Error, request: FastifyRequest, reply: FastifyReply) => {
  // Manejo de errores personalizados
  if (error instanceof HttpError) {
    reply.status(error.statusCode).send({ error: error.message });
    return;
  }

  // Manejo de errores de validación de Zod
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    reply.status(400).send({ 
      error: 'Error de validación', 
      details: formattedErrors 
    });
    return;
  }

  // Errores de validación nativos de Fastify (si existen)
  if ('validation' in error && (error as FastifyError).validation) {
    reply.status(400).send({ error: 'Datos inválidos', details: (error as FastifyError).validation });
    return;
  }

  // Errores inesperados
  request.log.error(error);
  reply.status(500).send({ error: 'Error interno del servidor' });
};
