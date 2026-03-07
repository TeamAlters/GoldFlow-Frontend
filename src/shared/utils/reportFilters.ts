import type { FilterValue, FilterComponentConfig, FilterConfig } from '../components/FilterComponent';
import type { TableColumn } from '../components/DataTable';

/** Query params shape used by many reports (customer, date range, purity). */
export type CommonReportFilterParams = {
  customer?: string;
  date_from?: string;
  date_to?: string;
  purity?: string;
};

export type ReportFilterSelectOption = { value: string; label: string };

const COMMON_REPORT_FILTER_KEYS = ['customer', 'date_from', 'date_to', 'purity'] as const;

function stringFromFilterValue(v: FilterValue): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    return s === '' ? undefined : s;
  }
  return undefined;
}

/**
 * Converts FilterComponent filter state to common report query params.
 * Use for reports that have customer, date_from, date_to, purity filters.
 */
export function commonReportFiltersToParams(
  filters: Record<string, FilterValue>
): CommonReportFilterParams {
  const params: CommonReportFilterParams = {};
  const c = stringFromFilterValue(filters.customer);
  if (c) params.customer = c;
  const dFrom = stringFromFilterValue(filters.date_from);
  if (dFrom) params.date_from = dFrom;
  const dTo = stringFromFilterValue(filters.date_to);
  if (dTo) params.date_to = dTo;
  const p = stringFromFilterValue(filters.purity);
  if (p) params.purity = p;
  return params;
}

/**
 * Columns for FilterComponent when using common report filters.
 * Use with buildCommonReportFilterConfig for a consistent filter bar.
 */
export function getCommonReportFilterColumns(): TableColumn<Record<string, unknown>>[] {
  return [
    { key: 'customer', header: 'Customer' },
    { key: 'date_from', header: 'Date From' },
    { key: 'date_to', header: 'Date To' },
    { key: 'purity', header: 'Purity' },
  ];
}

/**
 * Builds FilterComponentConfig for the common report filters (customer, date from, date to, purity).
 * Pass options from useReportFilterOptions() for select dropdowns.
 */
export function buildCommonReportFilterConfig(
  customerOptions: ReportFilterSelectOption[],
  purityOptions: ReportFilterSelectOption[]
): FilterComponentConfig {
  const defaultConfig: Record<string, FilterConfig> = {
    customer: {
      key: 'customer',
      label: 'Customer',
      dataType: 'select',
      options: customerOptions,
    },
    date_from: {
      key: 'date_from',
      label: 'Date From',
      dataType: 'datetime',
    },
    date_to: {
      key: 'date_to',
      label: 'Date To',
      dataType: 'datetime',
    },
    purity: {
      key: 'purity',
      label: 'Purity',
      dataType: 'select',
      options: purityOptions,
    },
  };
  return { default: defaultConfig };
}

export { COMMON_REPORT_FILTER_KEYS };
