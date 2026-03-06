/**
 * Builds DataTable columns from entity metadata.
 * Use this in list pages to avoid duplicating column/accessor/sortValue logic.
 */

import type { TableColumn } from '../components/DataTable';
import type { EntityField } from '../../modules/admin/admin.api';
import { getRowDisplayValue, getBooleanSortValue } from './common';
import { getEntityDetailRoute } from './referenceLinks';

export type BuildEntityListColumnsParams<_T extends Record<string, unknown> = Record<string, unknown>> = {
  visibleFields: EntityField[];
  detailLinkField: string;
  idField: string;
  detailRoute: string;
  isDarkMode: boolean;
  navigate: (to: string) => void;
  /** When true, use encodeURIComponent for row id in detail link (default true). */
  encodeId?: boolean;
  /** When true, provide sortValue for non-boolean fields using string coercion. Default false. */
  useStringSortForNonBoolean?: boolean;
  /** Row data for the table. When provided, columns with any value longer than longValueThreshold get center alignment. */
  data?: Record<string, unknown>[];
  /** Min string length to treat as "long" and center the whole column (default 15). */
  longValueThreshold?: number;
};

export function buildEntityListColumns<T extends Record<string, unknown> = Record<string, unknown>>(
  params: BuildEntityListColumnsParams<T>
): TableColumn<T>[] {
  const {
    visibleFields,
    detailLinkField,
    idField,
    detailRoute,
    isDarkMode,
    navigate,
    encodeId = true,
    useStringSortForNonBoolean = false,
    data,
    longValueThreshold = 8,
  } = params;

  const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-900';
  const linkClass = isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700';

  const makeAccessor = (fieldKey: string, fieldType: string, isDetailLink: boolean) => {
    return (row: T) => {
      const value = getRowDisplayValue(row, fieldKey, fieldType);
      const rowRecord = row as Record<string, unknown>;
      if (isDetailLink) {
        const rowId = rowRecord[idField] ?? rowRecord.id;
        if (rowId === undefined || rowId === null) {
          return <span className={textClass}>{value}</span>;
        }
        const url = detailRoute.replace(
          ':id',
          encodeId ? encodeURIComponent(String(rowId)) : String(rowId)
        );
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(url);
            }}
            className={linkClass}
          >
            {value}
          </button>
        );
      }
      const referenceRoute =
        typeof value === 'string' && value ? getEntityDetailRoute(fieldKey, value) : null;
      if (referenceRoute) {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(referenceRoute);
            }}
            className={linkClass}
          >
            {value}
          </button>
        );
      }
      return <span className={textClass}>{value}</span>;
    };
  };

  const filteredFields = visibleFields.filter((f) => f.name);

  const columnsWithLongValues = new Set<string>();
  if (data && data.length > 0 && longValueThreshold > 0) {
    for (const field of filteredFields) {
      const key = field.name;
      const hasLong = data.some((row) => {
        const val = (row as Record<string, unknown>)[key];
        const str = val !== undefined && val !== null ? String(val) : '';
        return str.length > longValueThreshold;
      });
      if (hasLong) columnsWithLongValues.add(key);
    }
  }

  return filteredFields.map((field) => {
    const fieldKey = field.name;
    const isBoolean =
      field.type?.toLowerCase() === 'boolean' || field.type?.toLowerCase() === 'bool';
    const centerAlign = isBoolean || columnsWithLongValues.has(fieldKey);
    return {
      key: fieldKey,
      header: field.label,
      sortable: true,
      align: centerAlign ? 'center' : undefined,
      sortValue: isBoolean
        ? (getBooleanSortValue(fieldKey) as (row: T) => number)
        : useStringSortForNonBoolean
          ? (row: T) => {
              const val = getRowDisplayValue(row, fieldKey, field.type);
              return typeof val === 'string' ? val : String((row as Record<string, unknown>)[fieldKey] ?? '');
            }
          : undefined,
      accessor: makeAccessor(fieldKey, field.type, fieldKey === detailLinkField),
    };
  }) as TableColumn<T>[];
}
