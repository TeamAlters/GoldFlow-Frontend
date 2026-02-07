import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/auth.store'
import DataTable from '../../shared/components/DataTable'
import type { TableColumn, TableAction } from '../../shared/components/DataTable'
import FilterComponent, { type FilterComponentConfig, type FilterConfig, type FilterValue } from '../../shared/components/FilterComponent'
import ListPageLayout from '../../shared/components/ListPageLayout'
import { useUIStore } from '../../stores/ui.store'
import { toast } from '../../stores/toast.store'
import { getEntityMetadataCache, setEntityMetadataCache } from '../../utils/entityCache'
import { getEntityMetadata, getEntityList, type EntityListFilter } from './admin.api'
import type { EntityField, EntityFilterField } from './admin.api'
import { getEntityConfig } from '../../config/entity.config'

/** Format ISO date-time string for UI (e.g. "31 Jan 2026, 12:37 pm") */
function formatDateTime(isoOrValue: string | number | null | undefined): string {
  if (isoOrValue === null || isoOrValue === undefined) return '—'
  const s = String(isoOrValue).trim()
  if (!s) return '—'
  const date = new Date(s)
  if (Number.isNaN(date.getTime())) return s
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function isDateTimeValue(val: unknown): boolean {
  if (val === null || val === undefined) return false
  return ISO_DATE_REGEX.test(String(val))
}

// Map metadata field names to row keys (for mock/API compatibility: username→name, status→role, etc.)
function getRowDisplayValue(row: Record<string, unknown>, fieldKey: string, fieldType?: string): string {
  const val = row[fieldKey]
  const resolved =
    val !== undefined && val !== null
      ? val
      : (() => {
        const aliases: Record<string, string> = { username: 'name', status: 'role', mobile_number: 'mobileNo' }
        const mapped = aliases[fieldKey] ? row[aliases[fieldKey]] : undefined
        return mapped
      })()
  if (resolved === undefined || resolved === null) return '—'
  if (fieldType === 'DateTime' || isDateTimeValue(resolved)) return formatDateTime(resolved as string | number)
  return String(resolved)
}

// User type: API can return id as string, and fields like username, status, mobile_number, etc.
type User = Record<string, unknown> & {
  id: string | number
  username?: string
  name?: string
  email?: string
  role?: string
  status?: string
  mobileNo?: string
  mobile_number?: string
}

function mapFieldTypeToDataType(apiType: string): 'string' | 'number' | 'select' | 'multi-select' {
  if (apiType === 'Boolean') return 'select'
  return 'string'
}

function defaultOperatorForType(apiType: string, operators: string[]): string {
  if (apiType === 'DateTime' && operators.includes('=')) return '='
  if (apiType === 'Boolean' && operators.includes('=')) return '='
  if (operators.includes('contains')) return 'contains'
  return operators[0] ?? '='
}

function metadataToFilterConfig(f: EntityFilterField): FilterConfig {
  const dataType = mapFieldTypeToDataType(f.type)
  const operators = f.operators ?? []
  return {
    key: f.field,
    label: f.label,
    dataType,
    operators,
    defaultOperator: defaultOperatorForType(f.type, operators),
  }
}

// Module-level in-flight flag so it survives Strict Mode unmount/remount (avoids duplicate API calls)
let metadataFetchInFlight = false

export default function UsersPage() {
  const navigate = useNavigate()
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  // Explicitly specify entity name for this page
  const entityName = 'user'
  const entityConfig = getEntityConfig(entityName)
  const [filters, setFilters] = useState<Record<string, FilterValue>>({})
  const [entityMetadata, setEntityMetadata] = useState<{
    display_name: string
    fields: EntityField[]
    filters: { default_visible: EntityFilterField[]; additional: EntityFilterField[] }
  } | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const lastToastedErrorRef = useRef<string | null>(null)

  const handleAuthError = useCallback(() => {
    console.warn('[GoldFlow] [UsersPage] Auth error – clearing session and redirecting to login')
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  // Show error in toaster once per distinct message (avoids double toast from Strict Mode / duplicate paths)
  const showErrorToast = useCallback((msg: string) => {
    if (lastToastedErrorRef.current === msg) return
    lastToastedErrorRef.current = msg
    toast.error(msg)
  }, [])

  // Fetch entity metadata (and save to cache on success)
  const fetchMetadata = useCallback(() => {
    if (!token) {
      console.warn('[GoldFlow] [UsersPage] fetchMetadata: no token, skipping')
      const msg = 'Not logged in. Sign in and try again.'
      setMetadataError(msg)
      showErrorToast(msg)
      setMetadataLoading(false)
      return
    }
    if (metadataFetchInFlight) {
      console.log('[GoldFlow] [UsersPage] fetchMetadata: request already in flight, skipping')
      return
    }
    metadataFetchInFlight = true
    setMetadataLoading(true)
    setMetadataError(null)
    lastToastedErrorRef.current = null
    getEntityMetadata(entityName)
      .then((res) => {
        const data = res.data
        if (data && (data.fields?.length || data.display_name != null || data.filters)) {
          const meta = {
            display_name: data.display_name ?? 'Users',
            fields: Array.isArray(data.fields) ? data.fields : [],
            filters: {
              default_visible: Array.isArray(data.filters?.default_visible) ? data.filters.default_visible : [],
              additional: Array.isArray(data.filters?.additional) ? data.filters.additional : [],
            },
          }
          console.log('[GoldFlow] [UsersPage] Metadata: from database (API)', { entityName })
          setEntityMetadata(meta)
          setEntityMetadataCache(entityName, meta)
        } else {
          const msg = 'Metadata response had no fields or filters.'
          setMetadataError(msg)
          showErrorToast(msg)
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load metadata'
        if (/credentials|401|validate|unauthorized/i.test(msg)) {
          console.warn('[GoldFlow] [UsersPage] fetchMetadata: auth error (401/credentials)', { msg })
          showErrorToast('Session expired. Please sign in again.')
          handleAuthError()
          return
        }
        console.log('[GoldFlow] [UsersPage] fetchMetadata: error', { msg })
        setMetadataError(msg)
        showErrorToast(msg)
      })
      .finally(() => {
        metadataFetchInFlight = false
        setMetadataLoading(false)
      })
  }, [token, entityName, showErrorToast, handleAuthError])

  useEffect(() => {
    if (!token) {
      console.warn('[GoldFlow] [UsersPage] useEffect: no token, not loading metadata')
      const msg = 'Not logged in. Sign in and try again.'
      setMetadataError(msg)
      showErrorToast(msg)
      setMetadataLoading(false)
      return
    }
    // Always try cache first (including on reload). Only call API when cache is missing.
    const cached = getEntityMetadataCache(entityName)
    if (cached) {
      console.log('[GoldFlow] [UsersPage] Metadata: from cache', { entityName, cachedAt: cached.fetchedAt })
      setEntityMetadata({
        display_name: cached.display_name,
        fields: cached.fields,
        filters: cached.filters,
      })
      setMetadataLoading(false)
      setMetadataError(null)
      return
    }
    fetchMetadata()
  }, [token, entityName, fetchMetadata, showErrorToast])

  // Convert UI filters to API format: [{ field, operator, value }]. Skip empty values; trim strings so "  anupam  " is sent as "anupam".
  const filtersForApi = useMemo((): EntityListFilter[] => {
    const trimValue = (v: string | string[] | null): string | string[] | null => {
      if (v === null || v === undefined) return v
      if (typeof v === 'string') return v.trim()
      if (Array.isArray(v)) return v.map((s) => (typeof s === 'string' ? s.trim() : s)).filter((s) => s !== '')
      return v
    }
    const out: EntityListFilter[] = []
    Object.entries(filters).forEach(([field, filterVal]) => {
      if (filterVal === null || filterVal === undefined) return
      const isObj = typeof filterVal === 'object' && filterVal !== null && 'operator' in filterVal && 'value' in filterVal
      const operator = isObj ? (filterVal as { operator: string }).operator : 'contains'
      const raw = isObj ? (filterVal as { value: string | string[] | null }).value : (filterVal as string)
      const value = trimValue(raw)
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      if (isEmpty) return
      out.push({ field, operator, value })
    })
    return out
  }, [filters])

  const fetchList = useCallback(() => {
    if (!token || !entityName) {
      console.log('[GoldFlow] [UsersPage] fetchList: skipped (no token or entityName)', { hasToken: !!token, entityName })
      return
    }
    console.log('[GoldFlow] [UsersPage] fetchList: request', { entityName, page, pageSize, filtersCount: filtersForApi.length })
    setListLoading(true)
    getEntityList(entityName, { page, page_size: pageSize, filters: filtersForApi })
      .then((res) => {
        const items = res.data?.items ?? []
        const pag = res.data?.pagination
        setUsers(items as User[])
        setTotalItems(pag?.total_items ?? 0)
        setTotalPages(pag?.total_pages ?? 0)
        console.log('[GoldFlow] [UsersPage] fetchList: success', { itemCount: items.length, totalItems: pag?.total_items, totalPages: pag?.total_pages })
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load list'
        if (/credentials|401|validate|unauthorized/i.test(msg)) {
          console.warn('[GoldFlow] [UsersPage] fetchList: auth error (401/credentials)', { msg })
          showErrorToast('Session expired. Please sign in again.')
          handleAuthError()
          return
        }
        console.log('[GoldFlow] [UsersPage] fetchList: error', { msg })
        showErrorToast(msg)
        setUsers([])
      })
      .finally(() => setListLoading(false))
  }, [token, entityName, page, pageSize, filtersForApi, showErrorToast, handleAuthError])

  useEffect(() => {
    if (!token || !entityMetadata) return
    fetchList()
  }, [token, entityMetadata, fetchList])

  // Table columns from metadata fields (visible_in_list only)
  const columns: TableColumn<User>[] = useMemo(() => {
    const visibleFields = entityMetadata?.fields?.filter((f) => f.visible_in_list) ?? []
    if (!visibleFields.length) return []
    return visibleFields.map((f) => ({
      key: f.name,
      header: f.label,
      sortable: true,
      accessor: (row: User) => (
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
          {getRowDisplayValue(row as Record<string, unknown>, f.name, f.type)}
        </span>
      ),
    }))
  }, [entityMetadata, isDarkMode])

  // Handle add entity - navigate to add page
  const handleAddEntity = () => {
    navigate(entityConfig.routes.add)
  }

  // Define table actions
  const actions: TableAction<User>[] = [
    {
      label: 'Edit',
      onClick: (row) => {
        navigate(`${entityConfig.routes.edit.replace(':id', String(row.id))}`)
      },
      variant: 'primary',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      label: 'Delete',
      onClick: (row) => {
        const displayName = (row.name ?? row.username ?? 'this user') as string
        if (window.confirm(`Are you sure you want to delete ${displayName}?`)) {
          // TODO: Implement delete functionality
          toast.info('Delete functionality to be implemented')
        }
      },
      variant: 'danger',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
  ]

  // Filter configuration from entity metadata (default_visible + additional)
  const filterConfig: FilterComponentConfig = useMemo(() => {
    if (!entityMetadata?.filters) return { default: {}, addable: {} }
    const defaultVisible = entityMetadata.filters.default_visible ?? []
    const additional = entityMetadata.filters.additional ?? []
    const defaultConfig: Record<string, FilterConfig> = {}
    defaultVisible.forEach((f) => {
      defaultConfig[f.field] = metadataToFilterConfig(f)
    })
    const addableConfig: Record<string, FilterConfig> = {}
    additional.forEach((f) => {
      addableConfig[f.field] = metadataToFilterConfig(f)
    })
    return { default: defaultConfig, addable: addableConfig }
  }, [entityMetadata])

  const handleRowClick = (row: User) => {
    console.log('Row clicked:', row)
    // Navigate to user detail page or open modal
  }

  const hasFilters =
    Object.keys(filterConfig.default).length > 0 ||
    Object.keys(filterConfig.addable ?? {}).length > 0

  return (
    <ListPageLayout
      title={
        metadataLoading
          ? '...'
          : (entityMetadata?.display_name ?? `${entityConfig.displayNamePlural} Management`)
      }
      description={`Manage all ${entityConfig.displayNamePlural.toLowerCase()} and their permissions`}
      toolbarLeft={
        <div
          className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          <span>Total {entityConfig.displayNamePlural}:</span>
          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {listLoading ? '...' : totalItems}
          </span>
        </div>
      }
      toolbarRight={
        <button
          className={`w-full sm:w-auto px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          onClick={handleAddEntity}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add {entityConfig.displayName}</span>
        </button>
      }
      filters={
        hasFilters ? (
          <FilterComponent
            columns={columns}
            config={filterConfig}
            onFilterChange={setFilters}
            initialFilters={filters}
          />
        ) : undefined
      }
    >
      {!metadataLoading && !metadataError && columns.length === 0 && (
        <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading table columns and filters…
        </p>
      )}

      {totalPages > 1 && (
        <div
          className={`mb-2 flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page <= 1 || listLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages || listLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        actions={actions}
        searchable={false}
        pagination={totalPages <= 1}
        pageSize={pageSize}
        loading={listLoading}
        onRowClick={handleRowClick}
        emptyMessage={`No ${entityConfig.displayNamePlural.toLowerCase()} found`}
      />
    </ListPageLayout>
  )
}
