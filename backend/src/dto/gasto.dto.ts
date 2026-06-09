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
  legalizacionId: number;
}

/** Datos opcionales para actualizar un gasto existente. */
export interface UpdateGastoDto {
  amount?: number;
  currency?: string;
  description?: string;
  tipo?: string;
}
