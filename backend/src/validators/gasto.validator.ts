import { z } from 'zod';

/**
 * Schemas de validación para el módulo de gastos.
 * Se aplican en el controlador antes de delegar al servicio.
 */

/** Valida el body para crear un gasto: monto positivo, tipo y legalizacionId requeridos. */
export const createGastoSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.string().optional().default('COP'),
  description: z.string().optional(),
  tipo: z.enum(['RECIBO', 'FACTURA', 'OTRO'], {
    errorMap: () => ({ message: 'El tipo debe ser RECIBO, FACTURA u OTRO' }),
  }),
  legalizacionId: z.number().int().positive('El ID de legalización es requerido'),
});

/** Valida el body para actualizar un gasto: todos los campos son opcionales. */
export const updateGastoSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo').optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  tipo: z.enum(['RECIBO', 'FACTURA', 'OTRO'], {
    errorMap: () => ({ message: 'El tipo debe ser RECIBO, FACTURA u OTRO' }),
  }).optional(),
});
