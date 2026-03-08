/**
 * Role API: list, get, create, update. Uses apiClient (auth via interceptor).
 */

import { apiClient, messageFromAxiosError } from '../../../api/axios';
import { roleConfig } from '../../../config/entity.config';
import type { PermissionsMatrix } from '../../../auth/rolesAndPermission/rolesAndPermissionForm';

const baseUrl = () => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const rolesPath = () => `${baseUrl()}${roleConfig.apiBasePath}`;

export interface RoleRow {
  id: number | string;
  role_name: string;
  is_system_role?: boolean;
  permissions?: Record<string, unknown>;
}

export interface RoleDetail extends RoleRow {
  permissions?: Record<string, unknown>;
  created_at?: string;
  created_by?: string;
  modified_at?: string;
  role_description?: string;
}

export interface RoleCreatePayload {
  role_name: string;
  is_system_role?: boolean;
  permissions?: PermissionsMatrix;
}

export type RoleUpdatePayload = RoleCreatePayload;

export type RoleListResponse = { success?: boolean; data?: RoleRow[]; message?: string; errors?: string[] };
export type RoleDetailResponse = { success?: boolean; data?: RoleDetail; message?: string; errors?: string[] };

export async function listRoles(): Promise<RoleRow[]> {
  const url = rolesPath();
  console.log('[GoldFlow] [role.api] listRoles: request', { url });
  try {
    const res = await apiClient.get<RoleListResponse>(url);
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).items)) {
      return (data as { items: RoleRow[] }).items;
    }
    return [];
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to load roles');
    console.log('[GoldFlow] [role.api] listRoles: failed', msg);
    throw new Error(msg);
  }
}

export async function getRole(id: string): Promise<RoleDetail | null> {
  const url = `${rolesPath()}/${encodeURIComponent(id)}`;
  console.log('[GoldFlow] [role.api] getRole: request', { id, url });
  try {
    const res = await apiClient.get<RoleDetailResponse>(url);
    if (res.data?.success && res.data?.data) return res.data.data;
    return null;
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to load role');
    console.log('[GoldFlow] [role.api] getRole: failed', { id, msg });
    throw new Error(msg);
  }
}

export async function createRole(payload: RoleCreatePayload): Promise<{ id?: number | string }> {
  const url = rolesPath();
  console.log('[GoldFlow] [role.api] createRole: request', { url });
  try {
    const res = await apiClient.post<{ success?: boolean; data?: { id?: number | string }; message?: string }>(url, payload);
    return res.data?.data ?? {};
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to create role');
    console.log('[GoldFlow] [role.api] createRole: failed', msg);
    throw new Error(msg);
  }
}

export async function updateRole(id: string, payload: RoleUpdatePayload): Promise<void> {
  const url = `${rolesPath()}/${encodeURIComponent(id)}`;
  console.log('[GoldFlow] [role.api] updateRole: request', { id, url });
  try {
    await apiClient.put(url, payload);
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to update role');
    console.log('[GoldFlow] [role.api] updateRole: failed', { id, msg });
    throw new Error(msg);
  }
}
