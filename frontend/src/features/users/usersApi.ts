import type { AdminUser, UserRole } from '../../entities/users';
import { apiRequest } from '../../shared/api';

export async function getAdminUsers(token: string) {
  return apiRequest<AdminUser[]>('/admin/users', { token });
}

export async function getAdminUserById(userId: string, token: string) {
  return apiRequest<AdminUser>(`/admin/users/${userId}`, { token });
}

export async function createAdminUser(
  payload: { email: string; fullName: string; password: string; role: UserRole },
  token: string,
) {
  return apiRequest<AdminUser>('/admin/users', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUser(
  userId: string,
  payload: { email: string; fullName: string; role: UserRole },
  token: string,
) {
  return apiRequest<AdminUser>(`/admin/users/${userId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserBlockStatus(userId: string, isBlocked: boolean, token: string) {
  return apiRequest<AdminUser>(`/admin/users/${userId}/block`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ isBlocked }),
  });
}

export async function sendAdminUserPasswordReset(userId: string, token: string) {
  return apiRequest<void>(`/admin/users/${userId}/send-password-reset`, {
    method: 'POST',
    token,
  });
}

export async function deactivateAdminUser(userId: string, token: string) {
  return apiRequest<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export async function restoreAdminUser(userId: string, token: string) {
  return apiRequest<AdminUser>(`/admin/users/${userId}/restore`, {
    method: 'POST',
    token,
  });
}
