/**
 * DTOs para el módulo de autenticación.
 * Definen la forma exacta de los datos que entran y salen de los endpoints de auth.
 */

/** Datos requeridos para registrar un nuevo usuario. */
export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

/** Datos requeridos para iniciar sesión. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Respuesta del endpoint de login/register. */
export interface AuthResponseDto {
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
  token: string;
}

/** Respuesta del endpoint /me con permisos del usuario. */
export interface MeResponseDto {
  id: number;
  email: string;
  name: string | null;
  role: string;
  permissions: string[];
}

/** Datos para cambiar la contraseña. */
export interface ChangePasswordDto {
  actual: string;
  nueva: string;
}
