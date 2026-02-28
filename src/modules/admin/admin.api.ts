/**
 * Admin / entity APIs
 * Base URL: VITE_API_BASE_URL from .env
 * Authenticated requests use Bearer token from auth store (via apiClient interceptor).
 */

import { apiClient, messageFromAxiosError } from '../../api/axios';
import { useAuthStore } from '../../auth/auth.store';
import { buildEntityUrl, ENTITY_REFERENCES_PATH, getEntityConfig } from '../../config/entity.config';

function hasAuthToken(): boolean {
  const token = useAuthStore.getState().token;
  return !!(token && typeof token === 'string');
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
  const hasToken = hasAuthToken();
  console.log('[GoldFlow] [admin.api] getEntityMetadata: request', {
    entityName,
    url: url.replace(/\?.*/, ''),
    hasToken,
  });
  if (!hasToken) {
    console.warn('[GoldFlow] [admin.api] getEntityMetadata: no token – backend may return 401');
  }
  let data: EntityMetadataResponse & { detail?: string | string[] };
  try {
    const res = await apiClient.get<EntityMetadataResponse & { detail?: string | string[] }>(url);
    data = res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to load metadata');
    console.log('[GoldFlow] [admin.api] getEntityMetadata: failed', {
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

  const rawFields = Array.isArray(raw.fields) ? raw.fields : [];
  const fields: EntityField[] = rawFields.map((f: Record<string, unknown>) => ({
    name: (f.name as string) ?? (f.field as string) ?? '',
    label: (f.label as string) ?? '',
    type: (f.type as string) ?? 'String',
    visible_in_list: (f.visible_in_list as boolean) ?? true,
  }));

  const out = {
    ...data,
    data: {
      entity_name: (raw.entity_name as string) ?? entityName,
      display_name: (raw.display_name as string) ?? '',
      fields,
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
  const hasToken = hasAuthToken();
  console.log('[GoldFlow] [admin.api] getEntityFormMetadata: request', {
    entityName,
    url: url.replace(/\?.*/, ''),
    hasToken,
  });
  if (!hasToken) {
    console.warn('[GoldFlow] [admin.api] getEntityFormMetadata: no token – backend may return 401');
  }
  let data: FormMetadataResponse & { detail?: string | string[] };
  try {
    const res = await apiClient.get<FormMetadataResponse & { detail?: string | string[] }>(url);
    data = res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to load form metadata');
    console.log('[GoldFlow] [admin.api] getEntityFormMetadata: failed', {
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
 * Deduplicates in-flight and caches result for the same entityName + page + page_size + filters so repeated callers share one request.
 */
const listRequestInFlight = new Map<string, Promise<EntityListResponse>>();
const listRequestCache = new Map<
  string,
  { result: EntityListResponse; expiresAt: number }
>();
const LIST_CACHE_TTL_MS = 60_000;

function getEntityListCacheKey(
  entityName: string,
  page: number,
  page_size: number,
  filters: EntityListFilter[]
): string {
  const filterPart = filters.length > 0 ? JSON.stringify(filters) : '';
  return `${entityName}:${page}:${page_size}:${filterPart}`;
}

export async function getEntityList(
  entityName: string,
  params: EntityListParams = {}
): Promise<EntityListResponse> {
  const config = getEntityConfig(entityName);
  const baseUrl = buildEntityUrl(config.api.list, entityName);
  const { page = 1, page_size = 20, filters = [] } = params;
  const cacheKey = getEntityListCacheKey(entityName, page, page_size, filters);

  const cached = listRequestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const existing = listRequestInFlight.get(cacheKey);
  if (existing) return existing;

  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('page_size', String(page_size));
  if (filters.length > 0) {
    search.set('filters', JSON.stringify(filters));
  }
  const url = `${baseUrl}?${search.toString()}`;
  console.log('[GoldFlow] [admin.api] getEntityList: request', {
    entityName,
    page,
    page_size,
    filtersCount: filters.length,
    filters: filters.length > 0 ? filters : undefined,
  });

  const promise = (async (): Promise<EntityListResponse> => {
    try {
      const res = await apiClient.get<EntityListResponse>(url);
      const data = res.data ?? ({} as EntityListResponse);
      listRequestCache.set(cacheKey, {
        result: data,
        expiresAt: Date.now() + LIST_CACHE_TTL_MS,
      });
      const itemsCount = data.data?.items?.length ?? 0;
      const totalItems = data.data?.pagination?.total_items;
      console.log('[GoldFlow] [admin.api] getEntityList: success', {
        entityName,
        itemsCount,
        totalItems,
      });
      return data;
    } catch (err) {
      const errMsg = messageFromAxiosError(err, 'Failed to load list');
      console.log('[GoldFlow] [admin.api] getEntityList: failed', { entityName, errMsg });
      throw new Error(errMsg);
    } finally {
      listRequestInFlight.delete(cacheKey);
    }
  })();

  listRequestInFlight.set(cacheKey, promise);
  return promise;
}

export type ReferenceOption = { value: string; label: string };

/** Response shape for references API (items may be in data or data.items) */
type EntityReferencesResponse = {
  success?: boolean;
  data?: Record<string, unknown>[] | { items?: Record<string, unknown>[] };
};

/**
 * GET /api/v1/entities/references/{entity_name}
 * Fetches reference options for dropdowns (Create/Edit forms).
 * @param params Optional query params (e.g. { product_name: 'Choco' }) to filter by product.
 */
export async function getEntityReferences(
  entityName: string,
  params?: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const url = buildEntityUrl(ENTITY_REFERENCES_PATH, entityName);
  console.log('[GoldFlow] [admin.api] getEntityReferences: request', { entityName, url, params });
  try {
    const res = await apiClient.get<EntityReferencesResponse & { data?: unknown }>(url, {
      params,
    });
    const body = res.data;
    if (Array.isArray(body)) return body;
    const data = body?.data;
    if (Array.isArray(data)) return data;
    const items = (data as { items?: Record<string, unknown>[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  } catch (err) {
    const errMsg = messageFromAxiosError(err, `Failed to load references for ${entityName}`);
    console.log('[GoldFlow] [admin.api] getEntityReferences: failed', { entityName, errMsg });
    throw new Error(errMsg);
  }
}

/**
 * Maps reference items to { value, label } for dropdowns.
 */
export function mapReferenceItemsToOptions(
  items: Record<string, unknown>[],
  valueKey: string,
  labelKey?: string
): ReferenceOption[] {
  const label = labelKey ?? valueKey;
  return items.map((row) => {
    const val = row[valueKey];
    const value = String(val ?? '');
    return { value, label: String((row[label] ?? val) ?? value) };
  });
}

/**
 * GET /api/v1/entities/references/{entity_name}
 * Fetches reference options for dropdowns (Create/Edit forms).
 */
export async function getEntityReferenceOptions(
  entityName: string,
  valueKey = 'name',
  labelKey = 'name'
): Promise<ReferenceOption[]> {
  const items = await getEntityReferences(entityName);
  return mapReferenceItemsToOptions(items, valueKey, labelKey);
}

/**
 * Fetches reference options filtered by product_name (e.g. wire_size?product_name=Choco).
 */
export async function getEntityReferenceOptionsFiltered(
  entityName: string,
  productName: string,
  valueKey = 'name',
  labelKey = 'name'
): Promise<ReferenceOption[]> {
  const items = await getEntityReferences(entityName, { product_name: productName });
  return mapReferenceItemsToOptions(items, valueKey, labelKey);
}

/**
 * Maps product reference items to { value, label }.
 * Handles API shapes: product_name, name, product_abbreviation, product_id, id.
 */
export function mapProductReferencesToOptions(items: Record<string, unknown>[]): ReferenceOption[] {
  return items
    .map((row) => {
      const name =
        row.product_name ?? row.name ?? row.product_abbreviation ?? row.product_abbrevation ?? '';
      const value = String(
        row.product_name ?? name ?? row.product_id ?? row.id ?? ''
      );
      const label = String(name || value);
      return { value, label };
    })
    .filter((o) => o.value !== '');
}

/**
 * Fetches product options from /api/v1/entities/references/product.
 */
export async function getProductReferenceOptions(): Promise<ReferenceOption[]> {
  const items = await getEntityReferences('product');
  return mapProductReferencesToOptions(items);
}

/**
 * Fetches entity list via /api/v1/entities/{entity_name}/list and maps to dropdown options.
 * Use this for Product and Department dropdowns instead of references API.
 * Deduplicates concurrent and repeated calls for the same entity so the list API is only called once.
 */
const entityListOptionsInFlight = new Map<string, Promise<ReferenceOption[]>>();
const entityListOptionsCache = new Map<
  string,
  { result: ReferenceOption[]; expiresAt: number }
>();
const ENTITY_LIST_OPTIONS_CACHE_TTL_MS = 60_000;

function getOptionsCacheKey(entityName: string, valueKey: string, labelKey: string): string {
  return `${entityName}:${valueKey}:${labelKey}`;
}

export async function getEntityListOptions(
  entityName: string,
  valueKey = 'id',
  labelKey = 'name'
): Promise<ReferenceOption[]> {
  const cacheKey = getOptionsCacheKey(entityName, valueKey, labelKey);
  const cached = entityListOptionsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.result);

  const existing = entityListOptionsInFlight.get(cacheKey);
  if (existing) return existing;

  const promise = (async (): Promise<ReferenceOption[]> => {
    try {
      const res = await getEntityList(entityName, { page: 1, page_size: 500 });
      const items = res.data?.items ?? [];
      const result = mapReferenceItemsToOptions(items, valueKey, labelKey);
      entityListOptionsCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + ENTITY_LIST_OPTIONS_CACHE_TTL_MS,
      });
      return result;
    } finally {
      entityListOptionsInFlight.delete(cacheKey);
    }
  })();

  entityListOptionsInFlight.set(cacheKey, promise);
  return promise;
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
  if (!config.api.create) {
    throw new Error(`Entity ${entityName} does not support create`);
  }
  const url = buildEntityUrl(config.api.create, entityName);

  console.log('[GoldFlow] [admin.api] createEntity: request', { entityName, url });

  try {
    const res = await apiClient.post<{
      success?: boolean;
      message?: string;
      data?: Record<string, unknown>;
    }>(url, data);
    console.log('[GoldFlow] [admin.api] createEntity: success', { entityName });
    return res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, `Failed to create ${entityName}`);
    console.log('[GoldFlow] [admin.api] createEntity: failed', { entityName, errMsg });
    throw new Error(errMsg);
  }
}

/**
 * GET /api/v1/entities/{entity_name}/{id}
 * Get a single entity item by ID. Pass options.signal to abort the request (e.g. on effect cleanup).
 */
export async function getEntity(
  entityName: string,
  id: string | number,
  options?: { signal?: AbortSignal }
): Promise<{ success?: boolean; message?: string; data?: Record<string, unknown> }> {
  const config = getEntityConfig(entityName);
  const url = buildEntityUrl(config.api.get, entityName, { id });

  console.log('[GoldFlow] [admin.api] getEntity: request', { entityName, id, url });

  try {
    const res = await apiClient.get<{
      success?: boolean;
      message?: string;
      data?: Record<string, unknown>;
    }>(url, { signal: options?.signal });
    console.log('[GoldFlow] [admin.api] getEntity: success', { entityName, id });
    return res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, `Failed to get ${entityName}`);
    console.log('[GoldFlow] [admin.api] getEntity: failed', { entityName, id, errMsg });
    throw new Error(errMsg);
  }
}

/**
 * PUT /api/v1/entities/{entity_name}/{entity_id}
 * Update an existing entity item
 */
export async function updateEntity(
  entityName: string,
  id: string | number,
  data: Record<string, unknown>
): Promise<{ success?: boolean; message?: string; data?: Record<string, unknown> }> {
  const config = getEntityConfig(entityName);
  if (!config.api.update) {
    throw new Error(`Entity ${entityName} does not support update`);
  }
  const url = buildEntityUrl(config.api.update, entityName, { id });

  console.log('[GoldFlow] [admin.api] updateEntity: request', { entityName, id, url });

  try {
    const res = await apiClient.put<{
      success?: boolean;
      message?: string;
      data?: Record<string, unknown>;
    }>(url, data);
    console.log('[GoldFlow] [admin.api] updateEntity: success', { entityName, id });
    return res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, `Failed to update ${entityName}`);
    console.log('[GoldFlow] [admin.api] updateEntity: failed', { entityName, id, errMsg });
    throw new Error(errMsg);
  }
}

/**
 * DELETE /api/v1/entities/{entity_name}/{entity_id}
 * Delete an entity item (e.g. product). Uses id_field from listing metadata (e.g. product_name).
 */
export async function deleteEntity(
  entityName: string,
  id: string | number
): Promise<{ success?: boolean; message?: string }> {
  const config = getEntityConfig(entityName);
  if (!config.api.delete) {
    throw new Error(`Entity ${entityName} does not support delete`);
  }
  const url = buildEntityUrl(config.api.delete, entityName, { id });

  console.log('[GoldFlow] [admin.api] deleteEntity: request', { entityName, id, url });

  try {
    const res = await apiClient.delete<{ success?: boolean; message?: string }>(url);
    console.log('[GoldFlow] [admin.api] deleteEntity: success', { entityName, id });
    return res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, `Failed to delete ${entityName}`);
    console.log('[GoldFlow] [admin.api] deleteEntity: failed', { entityName, id, errMsg });
    throw new Error(errMsg);
  }
}

/**
 * PUT /api/v1/entities/{entity_name}/{entity_id}
 * Update specific fields of an entity (e.g. status update)
 */
export async function updateEntityStatus(
  entityName: string,
  id: string | number,
  status: string
): Promise<{ success?: boolean; message?: string; data?: Record<string, unknown> }> {
  const config = getEntityConfig(entityName); 
  if (!config.api.update) {
    throw new Error(`Entity ${entityName} does not support update`);
  }
  const url = buildEntityUrl(config.api.update, entityName, { id });

  console.log('[GoldFlow] [admin.api] updateEntityStatus: request', { entityName, id, status, url });

  try {
    const res = await apiClient.put<{
      success?: boolean;
      message?: string;
      data?: Record<string, unknown>;
    }>(url, { status });
    console.log('[GoldFlow] [admin.api] updateEntityStatus: success', { entityName, id });
    return res.data ?? {};
  } catch (err) {
    const errMsg = messageFromAxiosError(err, `Failed to update status for ${entityName}`);
    console.log('[GoldFlow] [admin.api] updateEntityStatus: failed', { entityName, id, errMsg });
    throw new Error(errMsg);
  }
}
