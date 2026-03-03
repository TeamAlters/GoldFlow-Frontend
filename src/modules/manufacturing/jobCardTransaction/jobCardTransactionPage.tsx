import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import type { TableColumn } from '../../../shared/components/DataTable';
import FilterComponent, {
  type FilterComponentConfig,
  type FilterConfig,
  type FilterValue,
} from '../../../shared/components/FilterComponent';
import ListPageLayout from '../../../shared/components/ListPageLayout';
import Pagination from '../../../shared/components/Pagination';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { useAuthStore } from '../../../auth/auth.store';
import { useUIStore } from '../../../stores/ui.store';
import {
  getEntityMetadata,
  getEntityList,
  type EntityField,
  type EntityFilterField,
  type EntityListFilter,
} from '../../admin/admin.api';
import { getEntityConfig } from '../../../config/entity.config';
import { getRowDisplayValue } from '../../../shared/utils/common';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { metadataToFilterConfig } from '../../../shared/utils/entityFilters';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getEntityMetadataCache, setEntityMetadataCache } from '../../../utils/entityCache';

const ENTITY_NAME = 'job_card_transaction';
type EntityRow = Record<string, unknown>;

let metadataFetchInFlight = false;

export default function JobCardTransactionPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [metadata, setMetadata] = useState<{
    display_name: string;
    fields: EntityField[];
    filters: { default_visible: EntityFilterField[]; additional: EntityFilterField[] };
    id_field?: string;
    detail_link_field?: string;
    pagination?: { default_page_size?: number };
  } | null>(null);
  const [items, setItems] = useState<EntityRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMetadata = useCallback(async () => {
    if (!token) return;
    if (metadataFetchInFlight) return;
    metadataFetchInFlight = true;
    setMetadataLoading(true);
    try {
      const res = await getEntityMetadata(ENTITY_NAME);
      const meta = res.data;
      if (!meta) return;
      const normalizedMeta = {
        display_name: meta.display_name ?? entityConfig.displayNamePlural,
        fields: Array.isArray(meta.fields) ? meta.fields : [],
        filters: {
          default_visible: Array.isArray(meta.filters?.default_visible)
            ? meta.filters.default_visible
            : [],
          additional: Array.isArray(meta.filters?.additional) ? meta.filters.additional : [],
        },
        id_field: meta.id_field,
        detail_link_field: meta.detail_link_field,
        pagination: meta.pagination,
      };
      setMetadata(normalizedMeta);
      setEntityMetadataCache(ENTITY_NAME, normalizedMeta);
      if (meta.pagination?.default_page_size) {
        setPageSize(meta.pagination.default_page_size);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load metadata';
      showErrorToastUnlessAuth(msg);
    } finally {
      metadataFetchInFlight = false;
      setMetadataLoading(false);
    }
  }, [token, entityConfig.displayNamePlural]);

  const filterFieldTypeMap = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    if (!metadata?.filters) return map;
    const all = [...(metadata.filters.default_visible ?? []), ...(metadata.filters.additional ?? [])];
    all.forEach((f) => {
      map[f.field] = f.type ?? '';
    });
    return map;
  }, [metadata]);

  const filtersForApi = useMemo((): EntityListFilter[] => {
    const trimValue = (v: string | string[] | null): string | string[] | null => {
      if (v === null || v === undefined) return v;
      if (typeof v === 'string') return v.trim();
      if (Array.isArray(v)) {
        return v.map((s) => (typeof s === 'string' ? s.trim() : s)).filter((s) => s !== '');
      }
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
      const isDateTimeField =
        fieldType === 'datetime' || fieldType === 'date' || fieldType === 'date_time';

      if (isDateTimeField && operator === '=' && typeof value === 'string' && isDateOnly(value)) {
        const dateStr = value.trim();
        out.push({ field, operator: 'between', value: [`${dateStr}T00:00:00`, `${dateStr}T23:59:59`] });
        return;
      }

      out.push({ field, operator, value });
    });

    return out;
  }, [filters, filterFieldTypeMap]);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    try {
      const res = await getEntityList(ENTITY_NAME, { page, page_size: pageSize, filters: filtersForApi });
      const list = res.data?.items ?? [];
      const pagination = res.data?.pagination;
      setItems(Array.isArray(list) ? list : []);
      setTotalItems(pagination?.total_items ?? 0);
      setTotalPages(pagination?.total_pages ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load list';
      showErrorToastUnlessAuth(msg);
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, [token, page, pageSize, filtersForApi]);

  useEffect(() => {
    if (!token) return;
    const cached = getEntityMetadataCache(ENTITY_NAME);
    if (cached) {
      setMetadata({
        display_name: cached.display_name,
        fields: cached.fields as EntityField[],
        filters: cached.filters as {
          default_visible: EntityFilterField[];
          additional: EntityFilterField[];
        },
        id_field: cached.id_field,
        detail_link_field: cached.detail_link_field,
      });
      setMetadataLoading(false);
      return;
    }
    fetchMetadata();
  }, [token, fetchMetadata]);

  useEffect(() => {
    if (!metadataLoading) {
      fetchList();
    }
  }, [metadataLoading, fetchList]);

  const columns: TableColumn<EntityRow>[] = useMemo(() => {
    const visibleFields = metadata?.fields?.filter((field) => field.visible_in_list) ?? [];
    const detailLinkField = metadata?.detail_link_field ?? visibleFields[0]?.name;
    const idField = metadata?.id_field ?? 'id';

    const makeAccessor = (fieldKey: string, fieldType: string, isDetailLink: boolean) => {
      return (row: EntityRow) => {
        const value = getRowDisplayValue(row, fieldKey, fieldType);
        if (isDetailLink) {
          const rowId = row[idField] ?? row.id;
          if (rowId === undefined || rowId === null) {
            return (
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>{value}</span>
            );
          }
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(entityConfig.routes.detail.replace(':id', encodeURIComponent(String(rowId))));
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
        const referenceRoute = typeof value === 'string' && value ? getEntityDetailRoute(fieldKey, value) : null;
        if (referenceRoute) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(referenceRoute);
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
        return <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>{value}</span>;
      };
    };

    return visibleFields.map((field) => ({
      key: field.name,
      header: field.label,
      sortable: true,
      accessor: makeAccessor(field.name, field.type, field.name === detailLinkField),
    }));
  }, [metadata, isDarkMode, navigate, entityConfig.routes.detail]);

  const filterConfig: FilterComponentConfig = useMemo(() => {
    if (!metadata?.filters) return { default: {}, addable: {} };
    const defaultVisible = metadata.filters.default_visible ?? [];
    const additional = metadata.filters.additional ?? [];
    const defaultConfig: Record<string, FilterConfig> = {};
    defaultVisible.forEach((f) => {
      defaultConfig[f.field] = metadataToFilterConfig(f);
    });
    const addableConfig: Record<string, FilterConfig> = {};
    additional.forEach((f) => {
      addableConfig[f.field] = metadataToFilterConfig(f);
    });
    return { default: defaultConfig, addable: addableConfig };
  }, [metadata]);

  const hasFilters =
    Object.keys(filterConfig.default).length > 0 ||
    Object.keys(filterConfig.addable ?? {}).length > 0;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural },
        ]}
        className="mb-4"
      />
      <ListPageLayout
        title={metadataLoading ? '...' : (metadata?.display_name ?? entityConfig.displayNamePlural)}
        description={`View all ${entityConfig.displayNamePlural.toLowerCase()}`}
        toolbarLeft={
          <h2
            className={`flex items-center gap-2 text-xl font-bold tracking-tight ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <span>Total Data:</span>
            <span>{listLoading ? '...' : totalItems}</span>
          </h2>
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
        <DataTable
          data={items}
          columns={columns}
          searchable={false}
          pagination={totalPages <= 1}
          pageSize={pageSize}
          loading={listLoading || metadataLoading}
          emptyMessage={`No ${entityConfig.displayNamePlural.toLowerCase()} found`}
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={listLoading}
        />
      </ListPageLayout>
    </>
  );
}
