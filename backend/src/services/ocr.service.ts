import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpError } from '../errors/httpError.js';

export const OcrService = {
  /**
   * Extrae texto y datos de una imagen usando Google Gemini 1.5 Flash
   */
  async extractDataFromImage(imageBuffer: Buffer, mimetype: string) {
    try {
      console.log('Iniciando extracción con Gemini AI...');
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analiza esta imagen de una factura, recibo o nota crédito. 
      Extrae la siguiente información y devuélvela ÚNICAMENTE en un formato JSON válido con esta estructura exacta (si no encuentras un dato, déjalo en null o cadena vacía):
      {
        "razonSocial": "Nombre del proveedor",
        "nitProveedor": "Número de NIT, sin puntos ni guiones",
        "numeroFactura": "Número de la factura o nota",
        "fechaEmision": "Fecha en formato YYYY-MM-DD",
        "subtotal": número entero,
        "iva": número entero,
        "amount": número entero (Total)
      }
      NO devuelvas comillas invertidas (\`\`\`) ni texto adicional, SOLO el JSON puro.`;

      const imageParts = [
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimetype
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text();
      
      console.log('Respuesta cruda de Gemini:', text);

      // Limpiar markdown si el modelo lo devuelve a pesar de la instrucción
      if (text.startsWith('```json')) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      const extractedData = JSON.parse(text);

      // Limpieza adicional de montos
      const amount = extractedData.amount ? Number(extractedData.amount) : undefined;
      let subtotal = extractedData.subtotal ? Number(extractedData.subtotal) : undefined;
      let iva = extractedData.iva ? Number(extractedData.iva) : undefined;

      if (amount && !subtotal) {
        subtotal = Math.round(amount / 1.19);
        iva = amount - subtotal;
      }

      return {
        textExtracted: 'Extraído con IA Gemini',
        ocrConfidence: 99,
        extractedData: {
          razonSocial: extractedData.razonSocial || '',
          nitProveedor: extractedData.nitProveedor || '',
          numeroFactura: extractedData.numeroFactura || '',
          fechaEmision: extractedData.fechaEmision || new Date().toISOString(),
          subtotal,
          iva,
          amount,
        }
      };

    } catch (error) {
      console.error('Error en OCR Gemini:', error);
      throw new HttpError(500, 'Fallo al procesar el documento con Inteligencia Artificial.');
    }
  }
};
