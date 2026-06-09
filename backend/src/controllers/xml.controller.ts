import { FastifyRequest, FastifyReply } from 'fastify';
import { XmlService } from '../services/xml.service.js';
import { HttpError } from '../errors/httpError.js';

export const XmlController = {
  /**
   * POST /api/v1/sap/xml
   * Recibe un archivo XML y retorna los datos extraídos.
   */
  async extractData(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) throw new HttpError(400, 'No se recibió ningún archivo XML');

    // Removemos la verificación estricta de mimetype porque a veces los navegadores envían 'text/plain' o 'application/octet-stream' para XML
    if (!data.filename.toLowerCase().endsWith('.xml')) {
        throw new HttpError(400, 'El archivo debe tener extensión .xml');
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
    const result = await XmlService.extractDataFromXml(fileBuffer);

    return reply.send({ data: result });
  }
};
