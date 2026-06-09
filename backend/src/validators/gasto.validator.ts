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
  origen: z.enum(['MANUAL', 'ELECTRONICA', 'NO_ELECTRONICA'], {
    errorMap: () => ({ message: 'El origen debe ser MANUAL, ELECTRONICA o NO_ELECTRONICA' }),
  }).optional().default('MANUAL'),
  legalizacionId: z.number().int().positive('El ID de legalización es requerido'),
  nitProveedor: z.string().optional(),
  razonSocial: z.string().optional(),
  numeroFactura: z.string().optional(),
  fechaEmision: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
  subtotal: z.number().nonnegative().optional(),
  iva: z.number().nonnegative().optional(),
  sapDocId: z.string().optional(),
  ocrConfidence: z.number().min(0).max(100).optional(),
});

/** Valida el body para actualizar un gasto: todos los campos son opcionales. */
export const updateGastoSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo').optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  tipo: z.enum(['RECIBO', 'FACTURA', 'OTRO'], {
    errorMap: () => ({ message: 'El tipo debe ser RECIBO, FACTURA u OTRO' }),
  }).optional(),
  nitProveedor: z.string().optional(),
  razonSocial: z.string().optional(),
  numeroFactura: z.string().optional(),
  fechaEmision: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
  subtotal: z.number().nonnegative().optional(),
  iva: z.number().nonnegative().optional(),
});
