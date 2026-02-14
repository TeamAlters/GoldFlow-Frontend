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
import { getEntityMetadata, getEntityList, deleteEntity, type EntityListFilter } from '../../admin/admin.api';
import type { EntityField, EntityFilterField } from '../../admin/admin.api';
import { getEntityConfig } from '../../../config/entity.config';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { getRowDisplayValue } from '../../../shared/utils/common';
import { metadataToFilterConfig } from '../../../shared/utils/entityFilters';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';

type EntityRow = Record<string, unknown>;

let metadataFetchInFlight = false;

export default function DepartmentPage() {
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityName = 'department';
  const entityConfig = getEntityConfig(entityName);
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
  const [departments, setDepartments] = useState<EntityRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | undefined>(20);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<EntityRow | null>(null);
  const token = useAuthStore((state) => state.token);
  const lastToastedErrorRef = useRef<string | null>(null);

  const showErrorToast = useCallback((msg: string) => {
    if (lastToastedErrorRef.current === msg) return;
    lastToastedErrorRef.current = msg;
    toast.error(msg);
  }, []);

  const fetchMetadata = useCallback(() => {
    if (!token) {
      const msg = 'Not logged in. Sign in and try again.';
      setMetadataError(msg);
      showErrorToast(msg);
      setMetadataLoading(false);
      return;
    }
    if (metadataFetchInFlight) return;
    metadataFetchInFlight = true;
    setMetadataLoading(true);
    setMetadataError(null);
    lastToastedErrorRef.current = null;
    getEntityMetadata(entityName)
      .then((res) => {
        const data = res.data;
        if (data && (data.fields?.length || data.display_name != null || data.filters)) {
          const meta = {
            display_name: data.display_name ?? 'Departments',
            fields: Array.isArray(data.fields) ? data.fields : [],
            filters: {
              default_visible: Array.isArray(data.filters?.default_visible) ? data.filters.default_visible : [],
              additional: Array.isArray(data.filters?.additional) ? data.filters.additional : [],
            },
            pagination: data.pagination,
            id_field: data.id_field,
            detail_link_field: data.detail_link_field,
          };
          setEntityMetadata(meta);
          setEntityMetadataCache(entityName, meta);
        } else {
          setEntityMetadata({
            display_name: 'Departments',
            fields: [],
            filters: { default_visible: [], additional: [] },
            id_field: 'id',
            detail_link_field: 'name',
          });
        }
      })
      .catch(() => {
        setMetadataError(null);
      })
      .finally(() => {
        metadataFetchInFlight = false;
        setMetadataLoading(false);
      });
  }, [token, entityName, showErrorToast]);

  useEffect(() => {
    if (!token) {
      const msg = 'Not logged in. Sign in and try again.';
      setMetadataError(msg);
      showErrorToast(msg);
      setMetadataLoading(false);
      return;
    }
    const cached = getEntityMetadataCache(entityName);
    if (cached) {
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
  }, [token, entityName, fetchMetadata, showErrorToast]);

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

  const filtersForApi = useMemo((): EntityListFilter[] => {
    const trimValue = (v: string | string[] | null): string | string[] | null => {
      if (v === null || v === undefined) return v;
      if (typeof v === 'string') return v.trim();
      if (Array.isArray(v))
        return v.map((s) => (typeof s === 'string' ? s.trim() : s)).filter((s) => s !== '');
      return v;
    };
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
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) return;
      out.push({ field, operator, value });
    });
    return out;
  }, [filters, filterFieldTypeMap]);

  const fetchList = useCallback(() => {
    if (!token || !entityName) return;
    setListLoading(true);
    getEntityList(entityName, { page, page_size: pageSize, filters: filtersForApi })
      .then((res) => {
        type ResShape = { items?: unknown[]; data?: { items?: unknown[]; pagination?: Record<string, unknown> }; pagination?: Record<string, unknown> };
        const resData = (res as ResShape).data ?? res;
        const dataItems = (resData as { items?: unknown[] }).items;
        const topItems = (res as ResShape).items;
        const items: unknown[] = Array.isArray(dataItems) ? dataItems : Array.isArray(topItems) ? topItems : [];
        const pag = (resData as { pagination?: Record<string, unknown> }).pagination ?? (res as ResShape).pagination;
        const rows = items as EntityRow[];
        setDepartments(rows);
        setTotalItems((pag?.total_items as number) ?? 0);
        setTotalPages((pag?.total_pages as number) ?? 0);
      })
      .catch(() => {
        showErrorToastUnlessAuth('Failed to load departments');
        setDepartments([]);
        setTotalItems(0);
        setTotalPages(1);
      })
      .finally(() => setListLoading(false));
  }, [token, entityName, page, pageSize, filtersForApi]);

  useEffect(() => {
    if (!token || !entityMetadata) return;
    fetchList();
  }, [token, entityMetadata, fetchList]);

  const columns: TableColumn<EntityRow>[] = useMemo(() => {
    const visibleFields = entityMetadata?.fields?.filter((f) => f.visible_in_list) ?? [];
    const detailLinkField = entityMetadata?.detail_link_field ?? 'name';
    const idField = entityMetadata?.id_field ?? 'id';

    return visibleFields.map((f) => ({
      key: f.name,
      header: f.label,
      sortable: true,
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
                navigate(entityConfig.routes.detail.replace(':id', String(rowId ?? '')));
              }}
              className={
                isDarkMode
                  ? 'text-amber-400 hover:text-amber-300 underline'
                  : 'text-amber-600 hover:text-amber-700 underline'
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

  const handleAddEntity = () => navigate(entityConfig.routes.add);

  const idField = entityMetadata?.id_field ?? 'id';

  const handleDeleteClick = useCallback((row: EntityRow) => {
    setDeleteConfirmRow(row);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmRow) return;
    const rowId = deleteConfirmRow[idField];
    if (rowId === undefined || rowId === null) return;
    try {
      await deleteEntity(entityName, String(rowId));
      toast.success(`${entityConfig.displayName} deleted successfully.`);
      fetchList();
    } catch (err) {
      showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Failed to delete department');
    } finally {
      setDeleteConfirmRow(null);
    }
  }, [deleteConfirmRow, entityName, entityConfig.displayName, idField, fetchList]);

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      },
      {
        label: 'Delete',
        onClick: handleDeleteClick,
        variant: 'danger' as const,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
      },
    ],
    [idField, navigate, entityConfig.routes.edit, handleDeleteClick]
  );

  const filterConfig: FilterComponentConfig = useMemo(() => {
    const defaultVisible = entityMetadata?.filters?.default_visible ?? [];
    const additional = entityMetadata?.filters?.additional ?? [];
    const hasApiFilters = defaultVisible.length > 0 || additional.length > 0;
    const defaultConfig: Record<string, FilterConfig> = {};
    const addableConfig: Record<string, FilterConfig> = {};
    if (hasApiFilters) {
      defaultVisible.forEach((f) => {
        defaultConfig[f.field] = metadataToFilterConfig(f);
      });
      additional.forEach((f) => {
        addableConfig[f.field] = metadataToFilterConfig(f);
      });
    }
    return { default: defaultConfig, addable: addableConfig };
  }, [entityMetadata]);

  const hasFilters =
    Object.keys(filterConfig.default).length > 0 ||
    Object.keys(filterConfig.addable ?? {}).length > 0;

  const handleRowClick = useCallback(
    (row: EntityRow) => {
      const rowId = row[idField];
      if (rowId != null) {
        navigate(entityConfig.routes.detail.replace(':id', String(rowId)));
      }
    },
    [idField, navigate, entityConfig.routes.detail]
  );

  const deleteDisplayName = deleteConfirmRow
    ? String(deleteConfirmRow.name ?? deleteConfirmRow[idField] ?? '')
    : '';

  return (
    <>
      <ConfirmationDialog
        isOpen={deleteConfirmRow != null}
        onClose={() => setDeleteConfirmRow(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${entityConfig.displayName}`}
        message={
          deleteDisplayName
            ? `Are you sure you want to delete "${deleteDisplayName}"? This action cannot be undone.`
            : `Are you sure you want to delete this ${entityConfig.displayName.toLowerCase()}?`
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
        description={`Manage all ${entityConfig.displayNamePlural.toLowerCase()} and their permissions`}
        toolbarLeft={
          <h2
            className={`flex items-center gap-2 flex-nowrap whitespace-nowrap text-xl font-bold tracking-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            <span>Total {entityConfig.displayNamePlural}:</span>
            <span>{listLoading ? '...' : totalItems}</span>
          </h2>
        }
        toolbarRight={
          <button
            className={`w-full sm:w-auto px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
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
          data={departments}
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
