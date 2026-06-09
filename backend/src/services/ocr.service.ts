import Tesseract from 'tesseract.js';
import { HttpError } from '../errors/httpError.js';

export const OcrService = {
  /**
   * Extrae texto de una imagen o PDF (PDF debe estar convertido o soportado, 
   * Tesseract en JS nativamente maneja imágenes JPG/PNG, no PDF directamente.
   * Para este MVP de prueba, asumimos imagen).
   */
  async extractDataFromImage(imageBuffer: Buffer, mimetype: string) {
    if (mimetype === 'application/pdf') {
      throw new HttpError(400, 'El OCR gratuito actual solo soporta imágenes (JPG, PNG). Por favor convierte el PDF o sube una foto.');
    }

    try {
      console.log('Iniciando OCR con Tesseract.js...');
      
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageBuffer,
        'spa', // Español
        { logger: m => console.log(m) } // Opcional, para ver progreso
      );

      console.log('OCR Completado. Confianza media:', confidence);

      // Lógica heurística básica para extraer datos
      // En producción se usaría NLP o Regex más robustos
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      
      let nitProveedor = '';
      let numeroFactura = '';
      let amountStr = '';
      
      for (const line of lines) {
        const lower = line.toLowerCase();
        
        // Buscar NIT (ej: NIT. 901.189.979-5 o 860000261)
        if (!nitProveedor && (lower.includes('nit') || lower.includes('n.i.t'))) {
          const match = line.match(/\d{3}[.\s]?\d{3}[.\s]?\d{3}-?\d?/);
          if (match) nitProveedor = match[0];
        }

        // Buscar Factura o Nota (ej: TR9010, NCTR743, FE-1234)
        if (!numeroFactura && (lower.includes('factura') || lower.includes('fac ') || lower.includes('nota') || lower.includes('nctr'))) {
          // Busca palabras como NCTR743, TR9010, FE-9821
          const match = line.match(/([A-Z]{2,5}-?\d{3,10})/i);
          if (match) numeroFactura = match[1];
        }

        // Buscar Total (ej: TOTAL A PAGAR COP 2,794,615.42)
        if (!amountStr && (lower.includes('total') || lower.includes('pagar'))) {
          const match = line.match(/([\d,]+\.\d{2}|[\d.]{4,})/);
          if (match) {
            // Limpiar separadores de miles y convertir
            let val = match[1].replace(/,/g, ''); // quita comas si son miles
            amountStr = val;
          }
        }
      }

      const amount = amountStr ? Math.round(Number(amountStr)) : undefined;
      const subtotal = amount ? Math.round(amount / 1.19) : undefined; // Asumiendo 19% IVA
      const iva = amount ? amount - subtotal! : undefined;

      return {
        textExtracted: text.substring(0, 500) + '...', // Retornamos un preview
        ocrConfidence: Math.round(confidence),
        extractedData: {
          razonSocial: lines[0]?.substring(0, 50), // Asumimos primera línea es nombre
          nitProveedor,
          numeroFactura,
          fechaEmision: new Date().toISOString(), // Fecha actual
          subtotal,
          iva,
          amount,
        }
      };

    } catch (error) {
      console.error('Error en OCR:', error);
      throw new HttpError(500, 'Fallo al procesar el documento con OCR.');
    }
  }
};
