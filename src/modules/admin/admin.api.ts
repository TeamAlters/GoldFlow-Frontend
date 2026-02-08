/**
 * Admin / entity APIs
 * Base URL: VITE_API_BASE_URL from .env
 * Authenticated requests use Bearer token from auth store.
 */

import { useAuthStore } from '../../auth/auth.store';
import { buildEntityUrl, getEntityConfig } from '../../config/entity.config';

/** Build headers with Bearer token for authenticated API calls. Backend must accept "Authorization: Bearer <token>". */
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token && typeof token === 'string') {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token.trim()}`;
  }
  return headers;
}

export type EntityField = {
  name: string;
  label: string;
  type: string;
  visible_in_list: boolean;
};

export type EntityFilterField = {
  field: string;
  label: string;
  type: string;
  operators: string[];
};

export type EntityMetadataResponse = {
  success?: boolean;
  message?: string;
  data?: {
    entity_name: string;
    display_name: string;
    fields: EntityField[];
    filters: {
      default_visible: EntityFilterField[];
      additional: EntityFilterField[];
    };
    actions?: { create_url?: string };
    pagination?: { default_page_size?: number; page_sizes?: number[] };
    id_field?: string;
    detail_link_field?: string;
  };
  errors?: unknown;
  status_code?: number;
};

export type FormFieldMetadata = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  read_only: boolean;
  nullable: boolean;
};

export type FieldGroup = {
  id: string;
  label: string;
  fields: string[];
  collapsible: boolean;
};

export type FormMetadataResponse = {
  success?: boolean;
  message?: string;
  data?: {
    entity_name: string;
    display_name: string;
    field_groups: FieldGroup[];
    fields: Record<string, FormFieldMetadata>;
    actions?: Record<string, {
      label: string;
      url: string;
      method: string;
      type: string;
      confirmation_required?: boolean;
    }>;
  };
  errors?: unknown;
  status_code?: number;
};

/**
 * GET /api/v1/entities/{entity_name}/listing-metadata
 * Fetches metadata for entity list views (columns, filters, etc.)
 */
export async function getEntityMetadata(entityName: string): Promise<EntityMetadataResponse> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.listingMetadata, entityName);
  const headers = getAuthHeaders();
  const hasToken = !!(headers as Record<string, string>).Authorization;
  console.log('[GoldFlow] [admin.api] getEntityMetadata: request', {
    entityName,
    url: url.replace(/\?.*/, ''),
    hasToken,
  });
  if (!hasToken) {
    console.warn('[GoldFlow] [admin.api] getEntityMetadata: no token – backend may return 401');
  }
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let data: EntityMetadataResponse & { detail?: string | string[] } = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as EntityMetadataResponse & { detail?: string | string[] };
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const detail = data.detail;
    const detailStr =
      typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.join(', ') : null;
    const errMsg =
      detailStr ??
      (data as { message?: string }).message ??
      (Array.isArray((data as { errors?: string[] }).errors)
        ? (data as { errors: string[] }).errors.join(', ')
        : null) ??
      `Failed to load metadata (${res.status})`;
    console.log('[GoldFlow] [admin.api] getEntityMetadata: failed', {
      status: res.status,
      entityName,
      errMsg,
    });
    throw new Error(errMsg);
  }
  console.log('[GoldFlow] [admin.api] getEntityMetadata: success', { entityName });

  // Normalize: accept payload in .data or at top level
  const payload = (data as { data?: typeof data }).data ?? data;
  const raw = payload as Record<string, unknown>;
  const hasData = Array.isArray(raw?.fields) || raw?.display_name != null || raw?.filters != null;
  if (!hasData) return data as EntityMetadataResponse;

  const out = {
    ...data,
    data: {
      entity_name: (raw.entity_name as string) ?? entityName,
      display_name: (raw.display_name as string) ?? '',
      fields: (Array.isArray(raw.fields) ? raw.fields : []) as EntityField[],
      filters: {
        default_visible: Array.isArray((raw.filters as Record<string, unknown>)?.default_visible)
          ? (raw.filters as { default_visible: EntityFilterField[] }).default_visible
          : [],
        additional: Array.isArray((raw.filters as Record<string, unknown>)?.additional)
          ? (raw.filters as { additional: EntityFilterField[] }).additional
          : [],
      },
      ...(raw.actions != null && { actions: raw.actions as { create_url?: string } }),
      ...(raw.pagination != null && {
        pagination: raw.pagination as { default_page_size?: number; page_sizes?: number[] },
      }),
      ...(raw.id_field != null && { id_field: raw.id_field as string }),
      ...(raw.detail_link_field != null && { detail_link_field: raw.detail_link_field as string }),
    },
  } as EntityMetadataResponse;
  return out;
}

/**
 * GET /api/v1/entities/{entity_name}/form-metadata
 * Fetches metadata for entity forms (fields, validation, etc.)
 */
export async function getEntityFormMetadata(entityName: string): Promise<FormMetadataResponse> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.formMetadata, entityName);
  const headers = getAuthHeaders();
  const hasToken = !!(headers as Record<string, string>).Authorization;
  console.log('[GoldFlow] [admin.api] getEntityFormMetadata: request', {
    entityName,
    url: url.replace(/\?.*/, ''),
    hasToken,
  });
  if (!hasToken) {
    console.warn('[GoldFlow] [admin.api] getEntityFormMetadata: no token – backend may return 401');
  }
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let data: FormMetadataResponse & { detail?: string | string[] } = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as FormMetadataResponse & { detail?: string | string[] };
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const detail = data.detail;
    const detailStr =
      typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.join(', ') : null;
    const errMsg =
      detailStr ??
      (data as { message?: string }).message ??
      (Array.isArray((data as { errors?: string[] }).errors)
        ? (data as { errors: string[] }).errors.join(', ')
        : null) ??
      `Failed to load form metadata (${res.status})`;
    console.log('[GoldFlow] [admin.api] getEntityFormMetadata: failed', {
      status: res.status,
      entityName,
      errMsg,
    });
    throw new Error(errMsg);
  }
  console.log('[GoldFlow] [admin.api] getEntityFormMetadata: success', { entityName });

  // Normalize: accept payload in .data or at top level
  const payload = (data as { data?: typeof data }).data ?? data;
  const raw = payload as Record<string, unknown>;
  const hasData = Array.isArray(raw?.field_groups) || raw?.display_name != null || raw?.fields != null;
  if (!hasData) return data as FormMetadataResponse;

  const out = {
    ...data,
    data: {
      entity_name: (raw.entity_name as string) ?? entityName,
      display_name: (raw.display_name as string) ?? '',
      field_groups: (Array.isArray(raw.field_groups) ? raw.field_groups : []) as FieldGroup[],
      fields: (raw.fields as Record<string, FormFieldMetadata>) ?? {},
      ...(raw.actions != null && { 
        actions: raw.actions as Record<string, {
          label: string;
          url: string;
          method: string;
          type: string;
          confirmation_required?: boolean;
        }> 
      }),
    },
  } as FormMetadataResponse;
  return out;
}

/** Filter object sent to the list API */
export type EntityListFilter = {
  field: string;
  operator: string;
  value: string | string[] | boolean | null;
};

export type EntityListParams = {
  page?: number;
  page_size?: number;
  filters?: EntityListFilter[];
};

export type EntityListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    items: Record<string, unknown>[];
    pagination: { page: number; page_size: number; total_items: number; total_pages: number };
  };
  errors?: unknown;
  status_code?: number;
};

/**
 * GET /api/v1/entities/{entity_name}/list?page=1&page_size=20&filters=...
 * Fetches paginated list with optional filters. Filters are sent as JSON array of { field, operator, value }.
 */
export async function getEntityList(
  entityName: string,
  params: EntityListParams = {}
): Promise<EntityListResponse> {
  const config = getEntityConfig(entityName);
  const baseUrl = buildEntityUrl(config.api.list, entityName);
  const { page = 1, page_size = 20, filters = [] } = params;
  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('page_size', String(page_size));
  if (filters.length > 0) {
    search.set('filters', JSON.stringify(filters));
  }
  const url = `${baseUrl}?${search.toString()}`;
  const headers = getAuthHeaders();
  console.log('[GoldFlow] [admin.api] getEntityList: request', {
    entityName,
    page,
    page_size,
    filtersCount: filters.length,
    filters: filters.length > 0 ? filters : undefined,
  });
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let data: EntityListResponse & { detail?: string } = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as EntityListResponse & { detail?: string };
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const detail = (data as { detail?: string | string[] }).detail;
    const detailStr =
      typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.join(', ') : null;
    const errMsg =
      detailStr ??
      (data as { message?: string }).message ??
      (Array.isArray((data as { errors?: string[] }).errors)
        ? (data as { errors: string[] }).errors.join(', ')
        : null) ??
      `Failed to load list (${res.status})`;
    console.log('[GoldFlow] [admin.api] getEntityList: failed', {
      status: res.status,
      entityName,
      errMsg,
    });
    throw new Error(errMsg);
  }
  const itemsCount = data.data?.items?.length ?? 0;
  const totalItems = data.data?.pagination?.total_items;
  console.log('[GoldFlow] [admin.api] getEntityList: success', {
    entityName,
    itemsCount,
    totalItems,
  });
  return data;
}

/**
 * POST /api/v1/entities/{entity_name}
 * Create a new entity item
 */
export async function createEntity(
  entityName: string,
  data: Record<string, unknown>
): Promise<{ success?: boolean; message?: string; data?: Record<string, unknown> }> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.create, entityName);
  const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };

  console.log('[GoldFlow] [admin.api] createEntity: request', { entityName, url });

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let responseData: {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
    detail?: string;
  } = {};

  if (text.trim()) {
    try {
      responseData = JSON.parse(text);
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const errMsg =
      responseData.detail ??
      responseData.message ??
      `Failed to create ${entityName} (${res.status})`;
    console.log('[GoldFlow] [admin.api] createEntity: failed', {
      status: res.status,
      entityName,
      errMsg,
    });
    throw new Error(errMsg);
  }

  console.log('[GoldFlow] [admin.api] createEntity: success', { entityName });
  return responseData;
}

/**
 * GET /api/v1/entities/{entity_name}/{id}
 * Get a single entity item by ID
 */
export async function getEntity(
  entityName: string,
  id: string | number
): Promise<{ success?: boolean; message?: string; data?: Record<string, unknown> }> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.get, entityName, { id });
  const headers = getAuthHeaders();

  console.log('[GoldFlow] [admin.api] getEntity: request', { entityName, id, url });

  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let responseData: {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
    detail?: string;
  } = {};

  if (text.trim()) {
    try {
      responseData = JSON.parse(text);
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const errMsg =
      responseData.detail ?? responseData.message ?? `Failed to get ${entityName} (${res.status})`;
    console.log('[GoldFlow] [admin.api] getEntity: failed', {
      status: res.status,
      entityName,
      id,
      errMsg,
    });
    throw new Error(errMsg);
  }

  console.log('[GoldFlow] [admin.api] getEntity: success', { entityName, id });
  return responseData;
}

/**
 * PUT/PATCH /api/v1/entities/{entity_name}/{id}
 * Update an existing entity item
 */
export async function updateEntity(
  entityName: string,
  id: string | number,
  data: Record<string, unknown>
): Promise<{ success?: boolean; message?: string; data?: Record<string, unknown> }> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.update, entityName, { id });
  const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };

  console.log('[GoldFlow] [admin.api] updateEntity: request', { entityName, id, url });

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let responseData: {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
    detail?: string;
  } = {};

  if (text.trim()) {
    try {
      responseData = JSON.parse(text);
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const errMsg =
      responseData.detail ??
      responseData.message ??
      `Failed to update ${entityName} (${res.status})`;
    console.log('[GoldFlow] [admin.api] updateEntity: failed', {
      status: res.status,
      entityName,
      id,
      errMsg,
    });
    throw new Error(errMsg);
  }

  console.log('[GoldFlow] [admin.api] updateEntity: success', { entityName, id });
  return responseData;
}

/**
 * DELETE /api/v1/entities/{entity_name}/{id}
 * Delete an entity item
 */
export async function deleteEntity(
  entityName: string,
  id: string | number
): Promise<{ success?: boolean; message?: string }> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.delete, entityName, { id });
  const headers = getAuthHeaders();

  console.log('[GoldFlow] [admin.api] deleteEntity: request', { entityName, id, url });

  const res = await fetch(url, { method: 'DELETE', headers });
  const text = await res.text();
  let responseData: { success?: boolean; message?: string; detail?: string } = {};

  if (text.trim()) {
    try {
      responseData = JSON.parse(text);
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const errMsg =
      responseData.detail ??
      responseData.message ??
      `Failed to delete ${entityName} (${res.status})`;
    console.log('[GoldFlow] [admin.api] deleteEntity: failed', {
      status: res.status,
      entityName,
      id,
      errMsg,
    });
    throw new Error(errMsg);
  }

  console.log('[GoldFlow] [admin.api] deleteEntity: success', { entityName, id });
  return responseData;
}
