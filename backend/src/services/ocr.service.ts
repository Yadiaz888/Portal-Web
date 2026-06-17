import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpError } from '../errors/httpError.js';

export const OcrService = {
  /**
   * Extrae texto y datos de una imagen usando Google Gemini.
   */
  async extractDataFromImage(imageBuffer: Buffer, mimetype: string) {
    try {
      console.log('Iniciando extraccion con Gemini AI...');

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new HttpError(500, 'GEMINI_API_KEY no configurada en el servidor.');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

      const prompt = `Analiza esta imagen de una factura, recibo o nota credito.
      Extrae la siguiente informacion y devuelvela UNICAMENTE en un formato JSON valido con esta estructura exacta (si no encuentras un dato, dejalo en null o cadena vacia):
      {
        "razonSocial": "Nombre del proveedor (quita los puntos de las siglas, ej: si dice 'S.A.S.', pon 'SAS')",
        "nitProveedor": "Numero de NIT, SOLO numeros sin puntos ni comas, y SIN el digito de verificacion final (ej. si dice '901.189.979-5', devuelve '901189979')",
        "numeroFactura": "Numero de la factura o nota",
        "fechaEmision": "Fecha en formato YYYY-MM-DD",
        "subtotal": numero entero,
        "iva": numero entero,
        "amount": numero entero (Total),
        "description": "Concepto o descripcion del gasto en 1 o 2 frases. Si el documento trae un concepto literal, usalo. Si no lo trae, redacta una descripcion coherente con el proveedor, productos/servicios visibles y valor de la factura."
      }
      NO devuelvas comillas invertidas (\`\`\`) ni texto adicional, SOLO el JSON puro.`;

      const imageParts = [
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: mimetype,
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text();

      console.log('Respuesta cruda de Gemini:', text);

      // Limpiar markdown si el modelo lo devuelve a pesar de la instruccion.
      if (text.startsWith('```json')) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      const extractedData = JSON.parse(text);

      // Limpieza adicional de montos.
      const amount = extractedData.amount ? Number(extractedData.amount) : undefined;
      let subtotal = extractedData.subtotal ? Number(extractedData.subtotal) : undefined;
      let iva = extractedData.iva ? Number(extractedData.iva) : undefined;

      if (amount && !subtotal) {
        subtotal = Math.round(amount / 1.19);
        iva = amount - subtotal;
      }

      return {
        textExtracted: 'Extraido con IA Gemini',
        ocrConfidence: 99,
        extractedData: {
          razonSocial: extractedData.razonSocial || '',
          nitProveedor: extractedData.nitProveedor || '',
          numeroFactura: extractedData.numeroFactura || '',
          fechaEmision: extractedData.fechaEmision || new Date().toISOString(),
          subtotal,
          iva,
          amount,
          description: extractedData.description || '',
        },
      };
    } catch (error) {
      console.error('Error en OCR Gemini:', error);
      throw new HttpError(500, 'Fallo al procesar el documento con Inteligencia Artificial.');
    }
  },
};
