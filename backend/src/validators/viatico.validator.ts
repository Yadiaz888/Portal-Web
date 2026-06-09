import { z } from 'zod';

export const createViaticoSchema = z.object({
  description: z.string().min(1, 'La descripcion es requerida'),
  amount: z.number().positive('El monto debe ser positivo'),
  destination: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
