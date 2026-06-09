import { z } from 'zod';

export const createFacturaSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.string().min(1, 'La moneda es requerida'),
  description: z.string().optional(),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
});
