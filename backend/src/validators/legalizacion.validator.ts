import { z } from 'zod';

/**
 * Schemas de validación para el módulo de legalizaciones.
 * Se aplican en el controlador antes de delegar al servicio.
 */

/** Valida el body para crear una legalización: descripción y monto positivo requeridos. */
export const createLegalizacionSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().positive('El monto debe ser positivo'),
});
