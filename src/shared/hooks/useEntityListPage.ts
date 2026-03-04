import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getEntityConfig } from '../../config/entity.config';
import { useAuthStore } from '../../auth/auth.store';
import {
  getEntityList,
  getEntityMetadata,
  type EntityField,
  type EntityFilterField,
  type EntityListFilter,
} from '../../modules/admin/admin.api';
import {
  getEntityMetadataCache,
  setEntityMetadataCache,
} from '../../utils/entityCache';
import { toast } from '../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../utils/errorHandling';
import { metadataToFilterConfig } from '../utils/entityFilters';
import type {
  FilterComponentConfig,
  FilterConfig,
  FilterValue,
} from '../components/FilterComponent';
import { useEntityVersion } from '../../stores/entityMutation.store';

export interface UseEntityListPageResult {
  entityName: string;
  entityConfig: ReturnType<typeof getEntityConfig>;
  entityMetadata: {
    display_name: string;
    fields: EntityField[];
    filters: { default_visible: EntityFilterField[]; additional: EntityFilterField[] };
    pagination?: { default_page_size?: number; page_sizes?: number[] };
    id_field?: string;
    detail_link_field?: string;
  } | null;
  metadataLoading: boolean;
  metadataError: string | null;

  items: Record<string, unknown>[];
  listLoading: boolean;

  page: number;
  setPage: (page: number) => void;
  pageSize: number | undefined;
  setPageSize: (size: number | undefined) => void;
  totalItems: number;
  totalPages: number;

  filters: Record<string, FilterValue>;
  setFilters: (next: Record<string, FilterValue>) => void;
  filterConfig: FilterComponentConfig;
  hasFilters: boolean;

  refreshList: () => void;
}

const metadataFetchInFlightByEntity: Record<string, boolean> = {};

export function useEntityListPage(entityName: string): UseEntityListPageResult {
  const entityConfig = getEntityConfig(entityName);
  const token = useAuthStore((state) => state.token);
  const entityVersion = useEntityVersion(entityName);
  const lastMetadataToastRef = useRef<string | null>(null);

  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [entityMetadata, setEntityMetadata] =
    useState<UseEntityListPageResult['entityMetadata']>(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | undefined>(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const showMetadataToast = useCallback((msg: string) => {
    if (lastMetadataToastRef.current === msg) return;
    lastMetadataToastRef.current = msg;
    toast.error(msg);
  }, []);

  const fetchMetadata = useCallback(() => {
    if (!token) {
      const msg = 'Not logged in. Sign in and try again.';
      setMetadataError(msg);
      showMetadataToast(msg);
      setMetadataLoading(false);
      return;
    }

    if (metadataFetchInFlightByEntity[entityName]) return;
    metadataFetchInFlightByEntity[entityName] = true;

    setMetadataLoading(true);
    setMetadataError(null);
    lastMetadataToastRef.current = null;

    getEntityMetadata(entityName)
      .then((res) => {
        const data = res.data;
        if (data && (data.fields?.length || data.display_name != null || data.filters)) {
          const meta = {
            display_name: data.display_name ?? entityConfig.displayNamePlural,
            fields: Array.isArray(data.fields) ? data.fields : [],
            filters: {
              default_visible: Array.isArray(data.filters?.default_visible)
                ? data.filters.default_visible
                : [],
              additional: Array.isArray(data.filters?.additional)
                ? data.filters.additional
                : [],
            },
            pagination: data.pagination,
            id_field: data.id_field,
            detail_link_field: data.detail_link_field,
          };
          setEntityMetadata(meta);
          setEntityMetadataCache(entityName, meta);
        } else {
          const msg = 'Metadata response had no fields or filters.';
          setMetadataError(msg);
          showMetadataToast(msg);
        }
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : `Failed to load ${entityConfig.displayNamePlural.toLowerCase()} metadata`;
        setMetadataError(msg);
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => {
        metadataFetchInFlightByEntity[entityName] = false;
        setMetadataLoading(false);
      });
  }, [token, entityName, entityConfig.displayNamePlural, showMetadataToast]);

  useEffect(() => {
    if (!token) {
      const msg = 'Not logged in. Sign in and try again.';
      setMetadataError(msg);
      showMetadataToast(msg);
      setMetadataLoading(false);
      return;
    }

    const cached = getEntityMetadataCache(entityName) as
      | (UseEntityListPageResult['entityMetadata'] & { pagination?: { default_page_size?: number; page_sizes?: number[] } })
      | null;
    if (cached) {
      setEntityMetadata({
        display_name: cached.display_name,
        fields: cached.fields,
        filters: cached.filters,
        pagination: cached.pagination,
        id_field: cached.id_field,
        detail_link_field: cached.detail_link_field,
      });
      setMetadataLoading(false);
      setMetadataError(null);
      return;
    }

    fetchMetadata();
  }, [token, entityName, fetchMetadata, showMetadataToast]);

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
    if (!token || !entityName) return;
    setListLoading(true);

    getEntityList(entityName, { page, page_size: pageSize, filters: filtersForApi })
      .then((res) => {
        type ResShape = typeof res & {
          items?: unknown[];
          pagination?: {
            page?: number;
            page_size?: number;
            total_items?: number;
            total_pages?: number;
          };
        };
        type DataShape = {
          items?: unknown[];
          results?: unknown[];
          pagination?: ResShape['pagination'];
        };

        const data: DataShape | undefined = (res as ResShape).data ?? (res as ResShape);
        const listItems: unknown[] =
          (Array.isArray(data?.items) ? data.items : null) ??
          (Array.isArray((res as ResShape).items) ? (res as ResShape).items : null) ??
          (Array.isArray(data?.results) ? data.results : null) ??
          [];
        const pag = data?.pagination ?? (res as ResShape).pagination;

        setItems(listItems as Record<string, unknown>[]);
        setTotalItems(pag?.total_items ?? listItems.length ?? 0);
        setTotalPages(pag?.total_pages ?? 0);
        if (pag?.page_size != null) setPageSize(pag.page_size);
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : `Failed to load ${entityConfig.displayNamePlural.toLowerCase()}`;
        showErrorToastUnlessAuth(msg);
        setItems([]);
        setTotalItems(0);
        setTotalPages(0);
      })
      .finally(() => setListLoading(false));
  }, [token, entityName, page, pageSize, filtersForApi, entityConfig.displayNamePlural]);

  useEffect(() => {
    const defaultSize = entityMetadata?.pagination?.default_page_size;
    if (defaultSize != null && defaultSize > 0) setPageSize(defaultSize);
  }, [entityMetadata?.pagination?.default_page_size]);

  useEffect(() => {
    if (!token || !entityMetadata) return;
    fetchList();
  }, [token, entityMetadata, entityVersion, fetchList]);

  const filterConfig: FilterComponentConfig = useMemo(() => {
    if (!entityMetadata?.filters) return { default: {}, addable: {} };
    const defaultVisible = entityMetadata.filters.default_visible ?? [];
    const additional = entityMetadata.filters.additional ?? [];
    const defaultCfg: Record<string, FilterConfig> = {};
    const addableCfg: Record<string, FilterConfig> = {};

    defaultVisible.forEach((f) => {
      defaultCfg[f.field] = metadataToFilterConfig(f);
    });
    additional.forEach((f) => {
      addableCfg[f.field] = metadataToFilterConfig(f);
    });

    return { default: defaultCfg, addable: addableCfg };
  }, [entityMetadata]);

  const hasFilters =
    Object.keys(filterConfig.default).length > 0 ||
    Object.keys(filterConfig.addable ?? {}).length > 0;

  const refreshList = useCallback(() => {
    fetchList();
  }, [fetchList]);

  return {
    entityName,
    entityConfig,
    entityMetadata,
    metadataLoading,
    metadataError,
    items,
    listLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    filters,
    setFilters,
    filterConfig,
    hasFilters,
    refreshList,
  };
}

