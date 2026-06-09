import { User } from '../api/auth';

export function hasPermission(user: User | null, permission: string) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(user: User | null, permissions: string[]) {
  return permissions.some((permission) => hasPermission(user, permission));
}
