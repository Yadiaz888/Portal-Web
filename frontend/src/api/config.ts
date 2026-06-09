import client from './client';

export interface UserConfig {
  id: number;
  email: string;
  name: string;
  role: string;
  deletedAt: string | null;
}

export interface RoleConfig {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

export const getUsers = async (): Promise<UserConfig[]> => {
  const response = await client.get<UserConfig[]>('/api/v1/users');
  return response.data;
};

export const getRoles = async (): Promise<RoleConfig[]> => {
  const response = await client.get<RoleConfig[]>('/api/v1/users/roles');
  return response.data;
};

export const updateUser = async (id: number, data: { roleId?: number, isActive?: boolean }): Promise<UserConfig> => {
  const response = await client.patch<UserConfig>(`/api/v1/users/${id}`, data);
  return response.data;
};
