import client from './client';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await client.get<MeResponse>('/auth/me');
  return response.data;
};

export const changePassword = async (actual: string, nueva: string): Promise<{ success: boolean }> => {
  const response = await client.patch<{ success: boolean }>('/auth/password', { actual, nueva });
  return response.data;
};
