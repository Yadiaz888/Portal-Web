/**
 * DTOs para el módulo de legalizaciones.
 * Definen la forma exacta de los datos que entran al crear una legalización.
 */

/** Datos requeridos para crear una nueva legalización. */
export interface CreateLegalizacionDto {
  description: string;
  amount: number;
}
