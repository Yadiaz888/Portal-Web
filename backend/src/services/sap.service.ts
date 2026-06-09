import { HttpError } from '../errors/httpError.js';

export const SapService = {
  /**
   * Simula buscar una factura electrónica de SAP por NIT de proveedor
   */
  async getFacturaByNit(nit: string) {
    if (!nit || nit.length < 5) {
      throw new HttpError(400, 'El NIT proporcionado es inválido o muy corto.');
    }

    // Datos mockeados
    return {
      sapDocId: `SAP-${Math.floor(Math.random() * 1000000)}`,
      nitProveedor: nit,
      razonSocial: 'PROVEEDOR TECNOLOGICO S.A.S',
      numeroFactura: `FE-${Math.floor(Math.random() * 10000)}`,
      fechaEmision: new Date().toISOString(),
      subtotal: 840336,
      iva: 159664,
      amount: 1000000,
      description: 'Compra de equipos de cómputo reportada a DIAN/SAP',
      currency: 'COP',
    };
  }
};
