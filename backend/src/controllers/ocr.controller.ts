import { FastifyRequest, FastifyReply } from 'fastify';
import { OcrService } from '../services/ocr.service.js';
import { HttpError } from '../errors/httpError.js';

export const OcrController = {
  /**
   * POST /api/v1/ocr/extract
   * Recibe un archivo multipart y retorna los datos extraídos
   */
  async extractData(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) throw new HttpError(400, 'No se recibió ninguna imagen para procesar');

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

    const result = await OcrService.extractDataFromImage(fileBuffer, data.mimetype);

    return reply.send({ data: result });
  }
};
