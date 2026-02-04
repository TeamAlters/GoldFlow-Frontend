/**
 * Admin / entity APIs
 * Base URL: VITE_API_BASE_URL from .env
 * Authenticated requests use Bearer token from auth store.
 */

import { useAuthStore } from '../../auth/auth.store'

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? ''

/** Build headers with Bearer token for authenticated API calls. Backend must accept "Authorization: Bearer <token>". */
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token
  const headers: HeadersInit = { Accept: 'application/json' }
  if (token && typeof token === 'string') {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

export type EntityField = {
  name: string
  label: string
  type: string
  visible_in_list: boolean
}

export type EntityFilterField = {
  field: string
  label: string
  type: string
  operators: string[]
}

export type EntityMetadataResponse = {
  success?: boolean
  message?: string
  data?: {
    entity_name: string
    display_name: string
    fields: EntityField[]
    filters: {
      default_visible: EntityFilterField[]
      additional: EntityFilterField[]
    }
    actions?: { create_url?: string }
    pagination?: { default_page_size?: number; page_sizes?: number[] }
  }
  errors?: unknown
  status_code?: number
}

/** Metadata path template from env; {entity_name} is replaced at runtime. Default: /api/v1/entities/{entity_name}/listing-metadata */
const getEntityMetadataPath = (entityName: string): string => {
  const template =
    (typeof import.meta.env.VITE_ENTITY_METADATA_PATH === 'string' &&
      import.meta.env.VITE_ENTITY_METADATA_PATH.trim()) ||
    '/api/v1/entities/{entity_name}/listing-metadata'
  return template.replace(/\{entity_name\}/g, encodeURIComponent(entityName))
}

/**
 * GET /api/v1/entities/{entity_name}/listing-metadata
 * Path comes from VITE_ENTITY_METADATA_PATH in .env (default: /api/v1/entities/{entity_name}/listing-metadata).
 */
export async function getEntityMetadata(entityName: string): Promise<EntityMetadataResponse> {
  const baseUrl = getBaseUrl()
  const path = getEntityMetadataPath(entityName)
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = getAuthHeaders()
  const hasToken = !!(headers as Record<string, string>).Authorization
  console.log('[GoldFlow] [admin.api] getEntityMetadata: request', { entityName, url: url.replace(/\?.*/, ''), hasToken })
  if (!hasToken) {
    console.warn('[GoldFlow] [admin.api] getEntityMetadata: no token – backend may return 401')
  }
  const res = await fetch(url, { method: 'GET', headers })
  const text = await res.text()
  let data: EntityMetadataResponse & { detail?: string | string[] } = {}
  if (text.trim()) {
    try {
      data = JSON.parse(text) as EntityMetadataResponse & { detail?: string | string[] }
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const detail = data.detail
    const detailStr =
      typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.join(', ') : null
    const errMsg =
      detailStr ??
      (data as { message?: string }).message ??
      (Array.isArray((data as { errors?: string[] }).errors)
        ? (data as { errors: string[] }).errors.join(', ')
        : null) ??
      `Failed to load metadata (${res.status})`
    console.log('[GoldFlow] [admin.api] getEntityMetadata: failed', { status: res.status, entityName, errMsg })
    throw new Error(errMsg)
  }
  console.log('[GoldFlow] [admin.api] getEntityMetadata: success', { entityName })

  // Normalize: accept payload in .data or at top level
  const payload = (data as { data?: typeof data }).data ?? data
  const raw = payload as Record<string, unknown>
  const hasData =
    Array.isArray(raw?.fields) ||
    (raw?.display_name != null) ||
    (raw?.filters != null)
  if (!hasData) return data as EntityMetadataResponse

  const out = {
    ...data,
    data: {
      entity_name: (raw.entity_name as string) ?? entityName,
      display_name: (raw.display_name as string) ?? '',
      fields: (Array.isArray(raw.fields) ? raw.fields : []) as EntityField[],
      filters: {
        default_visible: Array.isArray((raw.filters as Record<string, unknown>)?.default_visible)
          ? ((raw.filters as { default_visible: EntityFilterField[] }).default_visible)
          : [],
        additional: Array.isArray((raw.filters as Record<string, unknown>)?.additional)
          ? ((raw.filters as { additional: EntityFilterField[] }).additional)
          : [],
      },
      ...(raw.actions != null && { actions: raw.actions as { create_url?: string } }),
      ...(raw.pagination != null && { pagination: raw.pagination as { default_page_size?: number; page_sizes?: number[] } }),
    },
  } as EntityMetadataResponse
  return out
}

/** Filter object sent to the list API */
export type EntityListFilter = { field: string; operator: string; value: string | string[] | null }

export type EntityListParams = {
  page?: number
  page_size?: number
  filters?: EntityListFilter[]
}

export type EntityListResponse = {
  success?: boolean
  message?: string
  data?: {
    items: Record<string, unknown>[]
    pagination: { page: number; page_size: number; total_items: number; total_pages: number }
  }
  errors?: unknown
  status_code?: number
}

const getEntityListPath = (entityName: string): string => {
  const template =
    (typeof import.meta.env.VITE_ENTITY_LIST_PATH === 'string' &&
      import.meta.env.VITE_ENTITY_LIST_PATH.trim()) ||
    '/api/v1/entities/{entity_name}/list'
  return template.replace(/\{entity_name\}/g, encodeURIComponent(entityName))
}

/**
 * GET /api/v1/entities/{entity_name}/list?page=1&page_size=20&filters=...
 * Fetches paginated list with optional filters. Filters are sent as JSON array of { field, operator, value }.
 */
export async function getEntityList(
  entityName: string,
  params: EntityListParams = {}
): Promise<EntityListResponse> {
  const baseUrl = getBaseUrl()
  const path = getEntityListPath(entityName)
  const { page = 1, page_size = 20, filters = [] } = params
  const search = new URLSearchParams()
  search.set('page', String(page))
  search.set('page_size', String(page_size))
  if (filters.length > 0) {
    search.set('filters', JSON.stringify(filters))
  }
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}?${search.toString()}`
  const headers = getAuthHeaders()
  console.log('[GoldFlow] [admin.api] getEntityList: request', { entityName, page, page_size, filtersCount: filters.length })
  const res = await fetch(url, { method: 'GET', headers })
  const text = await res.text()
  let data: EntityListResponse & { detail?: string } = {}
  if (text.trim()) {
    try {
      data = JSON.parse(text) as EntityListResponse & { detail?: string }
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const detail = (data as { detail?: string | string[] }).detail
    const detailStr =
      typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.join(', ') : null
    const errMsg =
      detailStr ??
      (data as { message?: string }).message ??
      (Array.isArray((data as { errors?: string[] }).errors)
        ? (data as { errors: string[] }).errors.join(', ')
        : null) ??
      `Failed to load list (${res.status})`
    console.log('[GoldFlow] [admin.api] getEntityList: failed', { status: res.status, entityName, errMsg })
    throw new Error(errMsg)
  }
  const itemsCount = data.data?.items?.length ?? 0
  const totalItems = data.data?.pagination?.total_items
  console.log('[GoldFlow] [admin.api] getEntityList: success', { entityName, itemsCount, totalItems })
  return data
}
