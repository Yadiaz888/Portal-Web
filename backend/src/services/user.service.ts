import { userRepository } from '../repositories/user.repository.js';
import { HttpError } from '../errors/httpError.js';

export const UserService = {
  async getAllUsers() {
    const users = await userRepository.findAll();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role.name,
      deletedAt: u.deletedAt
    }));
  },

  async updateUser(id: number, data: { roleId?: number, deletedAt?: Date | null }) {
    const user = await userRepository.update(id, data);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      deletedAt: user.deletedAt
    };
  },

  async getAllRoles() {
    const roles = await userRepository.findAllRoles();
    return roles.map(r => ({
      id: r.id,
      nombre: r.name,
      descripcion: r.description || `Rol de ${r.name}`,
      permisos: [...new Set(r.permissions.map((p: any) => p.permission.action))]
    }));
  }
};
