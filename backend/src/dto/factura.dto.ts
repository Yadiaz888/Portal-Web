/**
 * DTOs para el módulo de facturas.
 * Definen la forma exacta de los datos que entran al crear una factura.
 */

/** Datos requeridos para crear una nueva factura. */
export interface CreateFacturaDto {
  amount: number;
  currency: string;
  description?: string;
  vendor?: string;
  invoiceNumber?: string;
}
