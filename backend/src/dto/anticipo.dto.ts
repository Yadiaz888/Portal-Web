/**
 * DTOs para el módulo de anticipos.
 * Definen la forma exacta de los datos que entran al crear un anticipo.
 */

/** Datos requeridos para crear un nuevo anticipo. */
export interface CreateAnticipoDto {
  amount: number;
  currency: string;
  description?: string;
}
