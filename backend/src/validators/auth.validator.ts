import { z } from 'zod';

/**
 * Schemas de validación para el módulo de autenticación.
 * Cada schema valida el body de la request antes de que llegue al servicio.
 */

/** Valida los datos de registro: email válido, contraseña mín 6 chars. */
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().optional(),
});

/** Valida los datos de login: email y contraseña requeridos. */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const changePasswordSchema = z.object({
  actual: z.string().min(1, 'La contraseña actual es requerida'),
  nueva: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});
