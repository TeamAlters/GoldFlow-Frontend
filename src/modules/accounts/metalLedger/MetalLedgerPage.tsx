import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../auth/auth.store';
import DataTable from '../../../shared/components/DataTable';
import type { TableColumn, TableAction } from '../../../shared/components/DataTable';
import FilterComponent, {
  type FilterComponentConfig,
  type FilterConfig,
  type FilterValue,
} from '../../../shared/components/FilterComponent';
import ListPageLayout from '../../../shared/components/ListPageLayout';
import Pagination from '../../../shared/components/Pagination';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import { getEntityMetadataCache, setEntityMetadataCache } from '../../../utils/entityCache';
import { getEntityMetadata, getEntityList, deleteEntity, type EntityListFilter, type EntityField, type EntityFilterField } from '../../admin/admin.api';
import { getEntityConfig } from '../../../config/entity.config';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { getRowDisplayValue } from '../../../shared/utils/common';
import { metadataToFilterConfig } from '../../../shared/utils/entityFilters';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';

const ENTITY_NAME = 'metal_ledger';

// Row shape comes from the API
type EntityRow = Record<string, unknown>;

// Module-level in-flight flag so it survives Strict Mode unmount/remount
let metadataFetchInFlight = false;

export default function MetalLedgerPage() {
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityConfig = getEntityConfig(ENTITY_NAME);
  
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [entityMetadata, setEntityMetadata] = useState<{
    display_name: string;
    fields: EntityField[];
    filters: { default_visible: EntityFilterField[]; additional: EntityFilterField[] };
    pagination?: { default_page_size?: number; page_sizes?: number[] };
    id_field?: string;
    detail_link_field?: string;
  } | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [items, setItems] = useState<EntityRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | undefined>(20);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<EntityRow | null>(null);
  const token = useAuthStore((state) => state.token);
  const lastToastedErrorRef = useRef<string | null>(null);

  // Show error in toaster once per distinct message
  const showErrorToast = useCallback((msg: string) => {
    if (lastToastedErrorRef.current === msg) return;
    lastToastedErrorRef.current = msg;
    toast.error(msg);
  }, []);

  // Fetch entity metadata
  const fetchMetadata = useCallback(() => {
    if (!token) {
      console.warn('[GoldFlow] [MetalLedgerPage] fetchMetadata: no token, skipping');
      const msg = 'Not logged in. Sign in and try again.';
      setMetadataError(msg);
      showErrorToast(msg);
      setMetadataLoading(false);
      return;
    }
    if (metadataFetchInFlight) {
      console.log('[GoldFlow] [MetalLedgerPage] fetchMetadata: request already in flight, skipping');
      return;
    }
    metadataFetchInFlight = true;
    setMetadataLoading(true);
    setMetadataError(null);
    lastToastedErrorRef.current = null;
    getEntityMetadata(ENTITY_NAME)
      .then((res) => {
        const data = res.data;
        if (data && (data.fields?.length || data.display_name != null || data.filters)) {
          const meta = {
            display_name: data.display_name ?? 'Metal Ledger',
            fields: Array.isArray(data.fields) ? data.fields : [],
            filters: {
              default_visible: Array.isArray(data.filters?.default_visible)
                ? data.filters.default_visible
                : [],
              additional: Array.isArray(data.filters?.additional) ? data.filters.additional : [],
            },
            pagination: data.pagination,
            id_field: data.id_field,
            detail_link_field: data.detail_link_field,
          };
          console.log('[GoldFlow] [MetalLedgerPage] Metadata: from database (API)', { ENTITY_NAME });
          setEntityMetadata(meta);
          setEntityMetadataCache(ENTITY_NAME, meta);
        } else {
          const msg = 'Metadata response had no fields or filters.';
          setMetadataError(msg);
          showErrorToast(msg);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load metadata';
        console.log('[GoldFlow] [MetalLedgerPage] fetchMetadata: error', { msg });
        setMetadataError(msg);
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => {
        metadataFetchInFlight = false;
        setMetadataLoading(false);
      });
  }, [token, showErrorToast]);

  useEffect(() => {
    if (!token) {
      console.warn('[GoldFlow] [MetalLedgerPage] useEffect: no token, not loading metadata');
      const msg = 'Not logged in. Sign in and try again.';
      setMetadataError(msg);
      showErrorToast(msg);
      setMetadataLoading(false);
      return;
    }
    // Try cache first
    const cached = getEntityMetadataCache(ENTITY_NAME);
    if (cached) {
      console.log('[GoldFlow] [MetalLedgerPage] Metadata: from cache', {
        ENTITY_NAME,
        cachedAt: cached.fetchedAt,
      });
      setEntityMetadata({
        display_name: cached.display_name,
        fields: cached.fields,
        filters: cached.filters,
        id_field: cached.id_field,
        detail_link_field: cached.detail_link_field,
      });
      setMetadataLoading(false);
      setMetadataError(null);
      return;
    }
    fetchMetadata();
  }, [token, fetchMetadata, showErrorToast]);

  // Build map of filter field name -> type from metadata
  const filterFieldTypeMap = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    if (!entityMetadata?.filters) return map;
    const all = [
      ...(entityMetadata.filters.default_visible ?? []),
      ...(entityMetadata.filters.additional ?? []),
    ];
    all.forEach((f) => {
      map[f.field] = f.type ?? '';
    });
    return map;
  }, [entityMetadata]);

  // Convert UI filters to API format
  const filtersForApi = useMemo((): EntityListFilter[] => {
    const trimValue = (v: string | string[] | null): string | string[] | null => {
      if (v === null || v === undefined) return v;
      if (typeof v === 'string') return v.trim();
      if (Array.isArray(v))
        return v.map((s) => (typeof s === 'string' ? s.trim() : s)).filter((s) => s !== '');
      return v;
    };
    const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
    const out: EntityListFilter[] = [];
    Object.entries(filters).forEach(([field, filterVal]) => {
      if (filterVal === null || filterVal === undefined) return;
      const isObj =
        typeof filterVal === 'object' &&
        filterVal !== null &&
        'operator' in filterVal &&
        'value' in filterVal;
      const operator = isObj ? (filterVal as { operator: string }).operator : 'contains';
      const raw = isObj
        ? (filterVal as { value: string | string[] | null }).value
        : (filterVal as string);
      const value = trimValue(raw);
      if (operator === 'is not set') {
        out.push({ field, operator: 'is not set', value: true });
        return;
      }
      if (operator === 'is set') {
        out.push({ field, operator: 'is set', value: true });
        return;
      }
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) return;
      const fieldType = filterFieldTypeMap[field]?.toLowerCase() ?? '';
      const isDateTimeField = fieldType === 'datetime' || fieldType === 'date' || fieldType === 'date_time';
      if (isDateTimeField && operator === '=' && typeof value === 'string' && isDateOnly(value)) {
        const dateStr = value.trim();
        out.push({
          field,
          operator: 'between',
          value: [`${dateStr}T00:00:00`, `${dateStr}T23:59:59`],
        });
        return;
      }
      out.push({ field, operator, value });
    });
    return out;
  }, [filters, filterFieldTypeMap]);

  const fetchList = useCallback(() => {
    if (!token || !ENTITY_NAME) {
      console.log('[GoldFlow] [MetalLedgerPage] fetchList: skipped (no token or entityName)', {
        hasToken: !!token,
        entityName: ENTITY_NAME,
      });
      return;
    }
    console.log('[GoldFlow] [MetalLedgerPage] fetchList: request', {
      entityName: ENTITY_NAME,
      page,
      pageSize,
      filtersCount: filtersForApi.length,
    });
    setListLoading(true);
    getEntityList(ENTITY_NAME, { page, page_size: pageSize, filters: filtersForApi })
      .then((res) => {
        type ResShape = typeof res & {
          items?: unknown[];
          pagination?: { page?: number; page_size?: number; total_items?: number; total_pages?: number };
        };
        type DataShape = { items?: unknown[]; results?: unknown[]; pagination?: ResShape['pagination'] };
        const data: DataShape | undefined = res.data ?? (res as ResShape);
        const listItems: unknown[] =
          (Array.isArray(data?.items) ? data.items : null) ??
          (Array.isArray((res as ResShape).items) ? (res as ResShape).items : null) ??
          (Array.isArray(data?.results) ? data.results : null) ??
          [];
        const pag = data?.pagination ?? (res as ResShape).pagination;
        setItems(listItems as EntityRow[]);
        setTotalItems(pag?.total_items ?? 0);
        setTotalPages(pag?.total_pages ?? 0);
        if (pag?.page_size != null) setPageSize(pag.page_size);
        console.log('[GoldFlow] [MetalLedgerPage] fetchList: success', {
          itemCount: listItems.length,
          totalItems: pag?.total_items,
          totalPages: pag?.total_pages,
          pageSize: pag?.page_size,
        });
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load list';
        console.log('[GoldFlow] [MetalLedgerPage] fetchList: error', { msg });
        showErrorToastUnlessAuth(msg);
        setItems([]);
      })
      .finally(() => setListLoading(false));
  }, [token, page, pageSize, filtersForApi, showErrorToast]);

  useEffect(() => {
    const defaultSize = entityMetadata?.pagination?.default_page_size;
    if (defaultSize != null && defaultSize > 0) setPageSize(defaultSize);
  }, [entityMetadata?.pagination?.default_page_size]);

  useEffect(() => {
    if (!token || !entityMetadata) return;
    fetchList();
  }, [token, entityMetadata, fetchList]);

  // Table columns from metadata
  const columns: TableColumn<EntityRow>[] = useMemo(() => {
    const visibleFields = entityMetadata?.fields?.filter((f) => f.visible_in_list) ?? [];
    if (!visibleFields.length) return [];
    const detailLinkField = entityMetadata?.detail_link_field;
    const idField = entityMetadata?.id_field || 'voucher_no';

    return visibleFields.map((f) => ({
      key: f.name,
      header: f.label,
      sortable: true,
      // sortValue returns raw value for proper sorting (instead of React nodes)
      sortValue: (row: EntityRow) => {
        const value = getRowDisplayValue(row, f.name, f.type);
        // Return the raw value for sorting
        return value;
      },
      accessor: (row: EntityRow) => {
        const value = getRowDisplayValue(row, f.name, f.type);
        const isDetailLink = f.name === detailLinkField;

        if (isDetailLink) {
          const rowId = row[idField];
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(entityConfig.routes.detail.replace(':id', String(rowId)));
              }}
              className={
                isDarkMode
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-600 hover:text-amber-700'
              }
            >
              {value}
            </button>
          );
        }

        return (
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
            {value}
          </span>
        );
      },
    }));
  }, [entityMetadata, isDarkMode, navigate, entityConfig]);

  // Handle add entity
  const handleAddEntity = () => {
    navigate(entityConfig.routes.add);
  };

  const idField = entityMetadata?.id_field ?? 'voucher_no';

  const handleDeleteClick = useCallback((row: EntityRow) => {
    setDeleteConfirmRow(row);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmRow) return;
    const rowId = deleteConfirmRow[idField];
    if (rowId === undefined || rowId === null) return;
    try {
      await deleteEntity(ENTITY_NAME, String(rowId));
      toast.success(`${entityConfig.displayName} deleted successfully.`);
      fetchList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete metal ledger';
      showErrorToastUnlessAuth(msg);
    }
  }, [deleteConfirmRow, ENTITY_NAME, entityConfig.displayName, idField, fetchList]);

  // Define table actions
  const actions: TableAction<EntityRow>[] = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: (row) => {
          const rowId = row[idField];
          if (rowId !== undefined && rowId !== null) {
            navigate(entityConfig.routes.edit.replace(':id', String(rowId)));
          }
        },
        variant: 'primary' as const,
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
        onClick: handleDeleteClick,
        variant: 'danger' as const,
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
    ],
    [idField, navigate, entityConfig.routes.edit, handleDeleteClick]
  );

  // Filter configuration
  const filterConfig: FilterComponentConfig = useMemo(() => {
    if (!entityMetadata?.filters) return { default: {}, addable: {} };
    const defaultVisible = entityMetadata.filters.default_visible ?? [];
    const additional = entityMetadata.filters.additional ?? [];
    const defaultConfig: Record<string, FilterConfig> = {};
    defaultVisible.forEach((f) => {
      defaultConfig[f.field] = metadataToFilterConfig(f);
    });
    const addableConfig: Record<string, FilterConfig> = {};
    additional.forEach((f) => {
      addableConfig[f.field] = metadataToFilterConfig(f);
    });
    return { default: defaultConfig, addable: addableConfig };
  }, [entityMetadata]);

  const handleRowClick = (row: EntityRow) => {
    console.log('Row clicked:', row);
  };

  const hasFilters =
    Object.keys(filterConfig.default).length > 0 ||
    Object.keys(filterConfig.addable ?? {}).length > 0;

  const deleteDisplayName =
    deleteConfirmRow != null
      ? String(deleteConfirmRow.voucher_no ?? deleteConfirmRow.id ?? 'this metal ledger')
      : '';

  return (
    <>
      <ConfirmationDialog
        isOpen={deleteConfirmRow != null}
        onClose={() => setDeleteConfirmRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Metal Ledger"
        message={
          deleteDisplayName
            ? `Are you sure you want to delete "${deleteDisplayName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this metal ledger?'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural },
        ]}
        className="mb-4"
      />
      <ListPageLayout
        title={
          metadataLoading
            ? '...'
            : (entityMetadata?.display_name ?? `${entityConfig.displayNamePlural} Management`)
        }
        description={`Manage all ${entityConfig.displayNamePlural.toLowerCase()} records`}
        toolbarLeft={
          <h2
            className={`flex items-center gap-2 flex-nowrap whitespace-nowrap text-xl font-bold tracking-tight ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <span>Total Data:</span>
            <span>{listLoading ? '...' : totalItems}</span>
          </h2>
        }
        toolbarRight={
          <button
            className={`w-full sm:w-auto px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              isDarkMode
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

        <DataTable
          data={items}
          columns={columns}
          actions={actions}
          searchable={false}
          pagination={totalPages <= 1}
          pageSize={pageSize}
          loading={listLoading}
          onRowClick={handleRowClick}
          emptyMessage={`No ${entityConfig.displayNamePlural.toLowerCase()} found`}
        />
        <Pagination
          page={page}
          pageSize={pageSize ?? 20}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={listLoading}
        />
      </ListPageLayout>
    </>
  );
}
