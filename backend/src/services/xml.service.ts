import { XMLParser } from 'fast-xml-parser';
import { HttpError } from '../errors/httpError.js';

export const XmlService = {
  /**
   * Extrae los datos de una factura electrónica (DIAN UBL 2.1) desde un archivo XML.
   */
  async extractDataFromXml(xmlBuffer: Buffer) {
    try {
      const xmlData = xmlBuffer.toString('utf-8');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        removeNSPrefix: true, // Esto quita cac:, cbc:, ext: etc y hace más fácil leer el JSON
      });

      let parsed = parser.parse(xmlData);

      // Si es un AttachedDocument (Contenedor DIAN), la factura real está dentro de un CDATA en Attachment
      if (parsed.AttachedDocument && parsed.AttachedDocument.Attachment && parsed.AttachedDocument.Attachment.ExternalReference && parsed.AttachedDocument.Attachment.ExternalReference.Description) {
        const innerXml = parsed.AttachedDocument.Attachment.ExternalReference.Description;
        parsed = parser.parse(innerXml);
      }

      // Puede ser un Invoice o un CreditNote
      const document = parsed.Invoice || parsed.CreditNote;

      if (!document) {
        throw new HttpError(400, 'El archivo XML no parece ser una factura electrónica válida (DIAN UBL).');
      }

      // Extraer datos principales
      const numeroFactura = document.ID;
      const fechaEmision = document.IssueDate;
      
      const supplierParty = document.AccountingSupplierParty?.Party;
      const razonSocial = supplierParty?.PartyTaxScheme?.RegistrationName || supplierParty?.PartyName?.Name;
      const nitProveedor = supplierParty?.PartyTaxScheme?.CompanyID?.['#text'] || supplierParty?.PartyTaxScheme?.CompanyID || supplierParty?.PartyLegalEntity?.CompanyID?.['#text'] || supplierParty?.PartyLegalEntity?.CompanyID;

      const totals = document.LegalMonetaryTotal;
      const subtotal = totals?.LineExtensionAmount?.['#text'] || totals?.LineExtensionAmount || 0;
      const amount = totals?.PayableAmount?.['#text'] || totals?.PayableAmount || totals?.TaxInclusiveAmount?.['#text'] || totals?.TaxInclusiveAmount || 0;
      const iva = (amount - subtotal) > 0 ? (amount - subtotal) : 0;

      return {
        nitProveedor: String(nitProveedor),
        razonSocial: String(razonSocial),
        numeroFactura: String(numeroFactura),
        fechaEmision: new Date(fechaEmision).toISOString(),
        subtotal: Number(subtotal),
        iva: Number(iva),
        amount: Number(amount),
        description: `Lectura desde XML Electrónico`,
        xmlExtracted: true,
      };

    } catch (error: any) {
      console.error('Error parseando XML:', error);
      throw new HttpError(400, error.message || 'Error al procesar el archivo XML. Verifica que el formato sea correcto.');
    }
  }
};
