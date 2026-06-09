import { z } from 'zod';

export const createAnticipoSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.string().min(1, 'La moneda es requerida'),
  description: z.string().optional(),
});
