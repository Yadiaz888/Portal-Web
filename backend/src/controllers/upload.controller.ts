import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../errors/httpError.js';
import { supabaseClient, STORAGE_BUCKET } from '../lib/supabase.js';
import path from 'path';

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
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(storedName, fileBuffer, {
        contentType: data.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new HttpError(500, 'Error al subir el archivo al almacenamiento en la nube.');
    }

    const archivo = await prisma.gastoArchivo.create({
      data: {
        gastoId: id,
        filename: data.filename,
        mimetype: data.mimetype,
        size: totalSize,
        storagePath: uploadData.path, // We store the path inside the bucket
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

    const { data: fileData, error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .download(archivo.storagePath);

    if (error || !fileData) {
      throw new HttpError(404, 'Archivo en la nube no encontrado');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    reply.header('Content-Disposition', `attachment; filename="${archivo.filename}"`);
    reply.header('Content-Type', archivo.mimetype);
    return reply.send(buffer);
  },

  /**
   * DELETE /api/v1/gastos/:gastoId/archivos/:archivoId
   * Elimina un archivo adjunto de un gasto.
   */
  async deleteGastoArchivo(request: FastifyRequest, reply: FastifyReply) {
    const { archivoId } = request.params as { archivoId: string };
    const archivo = await prisma.gastoArchivo.findUnique({ where: { id: Number(archivoId) } });
    if (!archivo) throw new HttpError(404, 'Archivo no encontrado');

    // Remove from Supabase Storage
    const { error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .remove([archivo.storagePath]);

    if (error) {
      console.warn('Could not delete file from Supabase storage:', error);
    }

    await prisma.gastoArchivo.delete({ where: { id: Number(archivoId) } });
    return reply.code(204).send();
  },
};
