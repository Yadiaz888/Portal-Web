import { prisma } from '../lib/prisma.js';

/**
 * Repositorio de usuarios.
 * Centraliza todas las consultas a la tabla User.
 * Los servicios nunca deben acceder a Prisma directamente para esta entidad.
 */
export const userRepository = {
  /** Busca un usuario por email. Retorna null si no existe. */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  },

  /** Busca un usuario por ID. Retorna null si no existe. */
  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
  },

  /** Crea un nuevo usuario con el roleId proporcionado. */
  async create(data: { email: string; password: string; name?: string; roleId: number }) {
    return prisma.user.create({
      data,
      include: { role: true },
    });
  },

  /** Busca un rol por nombre (ej: 'USER', 'ADMIN'). */
  async findRoleByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  },

  /** Lista todos los usuarios con su rol. */
  async findAll() {
    return prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  /** Actualiza un usuario. */
  async update(id: number, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: true }
    });
  },

  /** Lista todos los roles con sus permisos. */
  async findAllRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }
};
