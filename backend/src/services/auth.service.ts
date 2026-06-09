import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository.js';
import { signToken } from '../lib/jwt.js';
import { HttpError } from '../errors/httpError.js';
import { RegisterDto, LoginDto, AuthResponseDto, MeResponseDto, ChangePasswordDto } from '../dto/auth.dto.js';

/**
 * Servicio de autenticación.
 * Maneja la lógica de negocio para registro, inicio de sesión y obtención de datos del usuario actual.
 */
export const AuthService = {
  /**
   * Registra un nuevo usuario con rol USER por defecto.
   * Lanza un error si el email ya existe.
   */
  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new HttpError(400, 'El email ya está en uso');
    }

    const userRole = await userRepository.findRoleByName('USER');
    if (!userRole) throw new HttpError(500, 'Role USER not configured');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      roleId: userRole.id,
    });

    const token = signToken({ userId: user.id });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: userRole.name },
      token,
    };
  },

  /**
   * Inicia sesión con email y contraseña.
   * Lanza error 401 si las credenciales son inválidas.
   */
  async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await userRepository.findByEmail(data.email);
    
    if (!user) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    const token = signToken({ userId: user.id });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role.name },
      token,
    };
  },

  /**
   * Obtiene la información del usuario autenticado actual, incluyendo sus permisos.
   * Lanza error 404 si el usuario fue eliminado o no se encuentra.
   */
  async getMe(userId: number): Promise<MeResponseDto> {
    const user = await userRepository.findById(userId);
    
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions: user.role.permissions.map((p: any) => `${p.permission.action}:${p.permission.resource}`)
    };
  },

  /**
   * Cambia la contraseña de un usuario autenticado.
   */
  async changePassword(userId: number, data: ChangePasswordDto): Promise<{ success: boolean }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    const valid = await bcrypt.compare(data.actual, user.password);
    if (!valid) throw new HttpError(400, 'La contraseña actual es incorrecta');

    const hashedPassword = await bcrypt.hash(data.nueva, 10);
    
    await userRepository.update(userId, { password: hashedPassword });
    
    return { success: true };
  }
};
