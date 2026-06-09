/**
 * DTOs para el módulo de gastos.
 * Definen la forma exacta de los datos que entran al crear / actualizar un gasto.
 */

/** Datos requeridos para crear un nuevo gasto asociado a una legalización. */
export interface CreateGastoDto {
  amount: number;
  currency?: string;
  description?: string;
  tipo: string; // 'RECIBO' | 'FACTURA' | 'OTRO'
  origen?: string; // 'MANUAL' | 'ELECTRONICA' | 'NO_ELECTRONICA'
  legalizacionId?: number;
  nitProveedor?: string;
  razonSocial?: string;
  numeroFactura?: string;
  fechaEmision?: string; // ISO date string
  subtotal?: number;
  iva?: number;
  sapDocId?: string;
  ocrConfidence?: number;
}

/** Datos opcionales para actualizar un gasto existente. */
export interface UpdateGastoDto {
  amount?: number;
  currency?: string;
  description?: string;
  tipo?: string;
  nitProveedor?: string;
  razonSocial?: string;
  numeroFactura?: string;
  fechaEmision?: string;
  subtotal?: number;
  iva?: number;
}
