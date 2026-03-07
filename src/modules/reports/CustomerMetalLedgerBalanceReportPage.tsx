import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUIStore } from '../../stores/ui.store';
import Breadcrumbs from '../../layout/Breadcrumbs';
import ListPageLayout from '../../shared/components/ListPageLayout';
import FilterComponent from '../../shared/components/FilterComponent';
import type { FilterValue } from '../../shared/components/FilterComponent';
import {
  commonReportFiltersToParams,
  buildCommonReportFilterConfig,
  getCommonReportFilterColumns,
} from '../../shared/utils/reportFilters';
import { useReportFilterOptions } from '../../shared/hooks/useReportFilterOptions';
import { getCustomerMetalLedgerBalanceReport } from './customerMetalLedgerBalanceReport.api';
import type { CustomerMetalLedgerCustomer } from './customerMetalLedgerBalanceReport.api';
import CustomerMetalLedgerBalanceHierarchy from './CustomerMetalLedgerBalanceHierarchy';
import { showErrorToastUnlessAuth } from '../../shared/utils/errorHandling';
import { getReportInitialExpanded } from '../../config/reportExpandDepth';

function loadReportWithParams(params: Parameters<typeof getCustomerMetalLedgerBalanceReport>[0]) {
  return getCustomerMetalLedgerBalanceReport(params).then((data) => ({
    customers: data,
    expanded: getReportInitialExpanded(data),
  }));
}

export default function CustomerMetalLedgerBalanceReportPage() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { customerOptions, purityOptions } = useReportFilterOptions();
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [customers, setCustomers] = useState<CustomerMetalLedgerCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const applyFilters = useCallback((filterValues: Record<string, FilterValue>) => {
    setLoading(true);
    const params = commonReportFiltersToParams(filterValues);
    getCustomerMetalLedgerBalanceReport(params)
      .then((data) => {
        setCustomers(data);
        setExpanded(getReportInitialExpanded(data));
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load report';
        showErrorToastUnlessAuth(msg);
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, FilterValue>) => {
      setFilters(newFilters);
      applyFilters(newFilters);
    },
    [applyFilters]
  );

  useEffect(() => {
    setLoading(true);
    loadReportWithParams({})
      .then(({ customers: data, expanded: initial }) => {
        setCustomers(data);
        setExpanded(initial);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load report';
        showErrorToastUnlessAuth(msg);
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const onToggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const columns = useMemo(() => getCommonReportFilterColumns(), []);
  const filterConfig = useMemo(
    () => buildCommonReportFilterConfig(customerOptions, purityOptions),
    [customerOptions, purityOptions]
  );

  const card = isDarkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports', href: '/reports' },
          { label: 'Customer Metal Ledger Balance Report' },
        ]}
        className="mb-4"
      />
      <ListPageLayout
        title="Customer Metal Ledger Balance Report"
        description="View customer-wise metal ledger balance with receipts and issues by purity. Use filters and click Apply Filters to refresh."
        toolbarLeft={
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {loading ? '…' : `Customers: ${customers.length}`}
          </h2>
        }
        filters={
          <FilterComponent<Record<string, unknown>>
            columns={columns}
            config={filterConfig}
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
        }
      >
        {loading && (
          <div className={`rounded-xl border p-8 text-center ${card}`}>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-500 border-t-transparent mx-auto mb-3" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading report…</p>
          </div>
        )}
        {!loading && (
          <CustomerMetalLedgerBalanceHierarchy
            customers={customers}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isDarkMode={isDarkMode}
          />
        )}
      </ListPageLayout>
    </div>
  );
}
