import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/request.types.js';
import { HttpError } from '../errors/httpError.js';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.resolve('uploads');

// Ensure uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const UploadController = {
  /**
   * POST /api/v1/gastos/:gastoId/archivos
   * Sube un archivo de soporte (PDF, JPG, PNG) vinculado a un gasto.
   */
  async uploadGastoArchivo(request: FastifyRequest, reply: FastifyReply) {
    const { gastoId } = request.params as { gastoId: string };
    const id = Number(gastoId);

    const gasto = await prisma.gasto.findUnique({ where: { id } });
    if (!gasto || gasto.deletedAt) throw new HttpError(404, 'Gasto no encontrado');

    const data = await request.file();
    if (!data) throw new HttpError(400, 'No se recibió ningún archivo');

    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimes.includes(data.mimetype)) {
      throw new HttpError(400, 'Tipo de archivo no permitido. Use JPG, PNG o PDF.');
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    const chunks: Buffer[] = [];
    let totalSize = 0;

    for await (const chunk of data.file) {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE_BYTES) {
        throw new HttpError(400, 'El archivo supera el límite de 5 MB');
      }
      chunks.push(chunk);
    }

    const fileBuffer = Buffer.concat(chunks);
    const ext = path.extname(data.filename) || '.bin';
    const storedName = `gasto_${id}_${Date.now()}${ext}`;
    const storagePath = path.join(UPLOADS_DIR, storedName);
    fs.writeFileSync(storagePath, fileBuffer);

    const archivo = await prisma.gastoArchivo.create({
      data: {
        gastoId: id,
        filename: data.filename,
        mimetype: data.mimetype,
        size: totalSize,
        storagePath: storedName,
      },
    });

    return reply.code(201).send({
      id: archivo.id,
      filename: archivo.filename,
      mimetype: archivo.mimetype,
      size: archivo.size,
      url: `/api/v1/gastos/${id}/archivos/${archivo.id}`,
    });
  },

  /**
   * GET /api/v1/gastos/:gastoId/archivos
   * Lista todos los archivos de un gasto.
   */
  async listGastoArchivos(request: FastifyRequest, reply: FastifyReply) {
    const { gastoId } = request.params as { gastoId: string };
    const archivos = await prisma.gastoArchivo.findMany({
      where: { gastoId: Number(gastoId) },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(archivos.map(a => ({
      id: a.id,
      filename: a.filename,
      mimetype: a.mimetype,
      size: a.size,
      url: `/api/v1/gastos/${gastoId}/archivos/${a.id}`,
      createdAt: a.createdAt,
    })));
  },

  /**
   * GET /api/v1/gastos/:gastoId/archivos/:archivoId/download
   * Descarga un archivo por su ID.
   */
  async downloadGastoArchivo(request: FastifyRequest, reply: FastifyReply) {
    const { archivoId } = request.params as { archivoId: string };
    const archivo = await prisma.gastoArchivo.findUnique({ where: { id: Number(archivoId) } });
    if (!archivo) throw new HttpError(404, 'Archivo no encontrado');

    const filePath = path.join(UPLOADS_DIR, archivo.storagePath);
    if (!fs.existsSync(filePath)) throw new HttpError(404, 'Archivo en disco no encontrado');

    const stream = fs.createReadStream(filePath);
    reply.header('Content-Disposition', `attachment; filename="${archivo.filename}"`);
    reply.header('Content-Type', archivo.mimetype);
    return reply.send(stream);
  },

  /**
   * DELETE /api/v1/gastos/:gastoId/archivos/:archivoId
   * Elimina un archivo adjunto de un gasto.
   */
  async deleteGastoArchivo(request: FastifyRequest, reply: FastifyReply) {
    const { archivoId } = request.params as { archivoId: string };
    const archivo = await prisma.gastoArchivo.findUnique({ where: { id: Number(archivoId) } });
    if (!archivo) throw new HttpError(404, 'Archivo no encontrado');

    const filePath = path.join(UPLOADS_DIR, archivo.storagePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.gastoArchivo.delete({ where: { id: Number(archivoId) } });
    return reply.code(204).send();
  },
};
