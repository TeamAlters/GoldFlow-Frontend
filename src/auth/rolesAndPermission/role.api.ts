/**
 * Role API: get, create, update. List uses getEntityList('role') from admin.api.
 * GET /api/v1/roles/{id}, POST /api/v1/roles (create), PUT /api/v1/roles/{id} (update).
 */

import { apiClient, messageFromAxiosError } from '../../api/axios';
import { buildEntityUrl, roleConfig } from '../../config/entity.config';
import type { PermissionsMatrix, TablePermissions } from './rolesAndPermissionForm';

/** API permissions use "edit"; we use "update". */
export type ApiPermissions = Record<string, { read?: boolean; create?: boolean; edit?: boolean; delete?: boolean; export?: boolean }>;

export interface RoleDetail {
  id: number | string;
  name: string;
  description?: string;
  is_system_role?: boolean;
  permissions?: ApiPermissions;
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreatePayload {
  name: string;
  description?: string;
  is_system_role?: boolean;
  permissions?: ApiPermissions;
}

export type RoleUpdatePayload = RoleCreatePayload;

/** Convert our PermissionsMatrix (update) to API shape (edit). */
export function permissionsToApi(perms: PermissionsMatrix): ApiPermissions {
  const out: ApiPermissions = {};
  Object.entries(perms).forEach(([entity, row]) => {
    out[entity] = {
      read: row.read,
      create: row.create,
      edit: row.update,
      delete: row.delete,
      export: row.export,
    };
  });
  return out;
}

/** Convert API permissions (edit) to our PermissionsMatrix (update). */
export function permissionsFromApi(api: ApiPermissions | undefined): PermissionsMatrix {
  const out: PermissionsMatrix = {};
  if (!api || typeof api !== 'object') return out;
  Object.entries(api).forEach(([entity, row]) => {
    if (row && typeof row === 'object') {
      out[entity] = {
        create: Boolean(row.create),
        read: Boolean(row.read),
        update: Boolean(row.edit),
        delete: Boolean(row.delete),
        export: Boolean(row.export),
      } as TablePermissions;
    }
  });
  return out;
}

export type RoleDetailResponse = { success?: boolean; data?: RoleDetail; message?: string; errors?: string[] };

/**
 * GET /api/v1/entities/names
 * Fetches entity names for the permissions matrix (Tables).
 */
export async function getPermissionEntities(): Promise<string[]> {
  const url = buildEntityUrl('/api/v1/entities/names', '');
  console.log('[GoldFlow] [role.api] getPermissionEntities: request', { url });
  try {
    const res = await apiClient.get<{ success?: boolean; data?: string[] | { entities?: string[] }; message?: string }>(url);
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    const entities = (data as { entities?: string[] } | undefined)?.entities;
    return Array.isArray(entities) ? entities : [];
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to load permission entities');
    console.log('[GoldFlow] [role.api] getPermissionEntities: failed', msg);
    throw new Error(msg);
  }
}

export async function getRole(id: string): Promise<RoleDetail | null> {
  const base = roleConfig.apiBasePath.replace(/\/$/, '');
  const url = buildEntityUrl(`${base}/{id}`, '', { id });
  console.log('[GoldFlow] [role.api] getRole: request', { id, url });
  try {
    const res = await apiClient.get<RoleDetailResponse & { data?: { data?: RoleDetail } }>(url);
    const body = res.data;
    if (!body || typeof body !== 'object') return null;
    const inner = body.data;
    if (inner && typeof inner === 'object' && 'permissions' in inner) {
      return inner as unknown as RoleDetail;
    }
    if (inner && typeof inner === 'object' && 'id' in inner && 'name' in inner) {
      return inner as unknown as RoleDetail;
    }
    if (body && typeof body === 'object' && 'id' in body && 'name' in body) {
      return body as unknown as RoleDetail;
    }
    return null;
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to load role');
    console.log('[GoldFlow] [role.api] getRole: failed', { id, msg });
    throw new Error(msg);
  }
}

export async function createRole(payload: RoleCreatePayload): Promise<{ id?: number | string }> {
  const base = roleConfig.apiBasePath.replace(/\/$/, '');
  const url = buildEntityUrl(base, '');
  console.log('[GoldFlow] [role.api] createRole: request', { url, payload });
  try {
    const res = await apiClient.post<{ success?: boolean; data?: RoleDetail; message?: string }>(
      url,
      payload
    );
    const data = res.data?.data;
    if (data?.id != null) return { id: data.id };
    return {};
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to create role');
    console.log('[GoldFlow] [role.api] createRole: failed', msg);
    throw new Error(msg);
  }
}

export async function updateRole(id: string, payload: RoleUpdatePayload): Promise<void> {
  const base = roleConfig.apiBasePath.replace(/\/$/, '');
  const url = buildEntityUrl(`${base}/{id}`, '', { id });
  console.log('[GoldFlow] [role.api] updateRole: request', { id, url });
  try {
    await apiClient.put(url, payload);
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to update role');
    console.log('[GoldFlow] [role.api] updateRole: failed', { id, msg });
    throw new Error(msg);
  }
}
