/**
 * DTOs para el módulo de viáticos.
 * Definen la forma exacta de los datos que entran al crear un viático.
 */

/** Datos requeridos para crear un nuevo viático. */
export interface CreateViaticoDto {
  description: string;
  amount: number;
  destination?: string;
  startDate?: string;
  endDate?: string;
}
