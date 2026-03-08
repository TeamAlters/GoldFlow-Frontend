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
import type { CommonReportFilterParams } from '../../shared/utils/reportFilters';
import { useReportFilterOptions } from '../../shared/hooks/useReportFilterOptions';
import { getStockManagementReport } from './stockManagementReport.api';
import type { StockManagementReportData } from './stockManagementReport.api';
import { StockManagementReceiptSection } from './StockManagementReceiptSection';
import { StockManagementProductionSection } from './StockManagementProductionSection';
import { StockManagementIssueSection } from './StockManagementIssueSection';
import { StockManagementBalanceStockSection } from './StockManagementBalanceStockSection';
import { showErrorToastUnlessAuth } from '../../shared/utils/errorHandling';

export default function StockManagementReportPage() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { customerOptions, purityOptions } = useReportFilterOptions();
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [data, setData] = useState<StockManagementReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptExpanded, setReceiptExpanded] = useState<Set<string>>(new Set());
  const [productionExpanded, setProductionExpanded] = useState<Set<string>>(new Set());
  const [issueExpanded, setIssueExpanded] = useState<Set<string>>(new Set());

  const applyFilters = useCallback((filterValues: Record<string, FilterValue>) => {
  const applyFilters = useCallback((filterValues: Record<string, FilterValue>) => {
    setLoading(true);
    setError(null);
    const params = commonReportFiltersToParams(filterValues);
    getStockManagementReport(params)
      .then((reportData) => {
        setData(reportData);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load report';
        showErrorToastUnlessAuth(msg);
        setError(msg);
        setData(null);
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
    setError(null);
    getStockManagementReport({})
      .then((reportData) => {
        setData(reportData);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load report';
        showErrorToastUnlessAuth(msg);
        setError(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const onToggleReceiptExpand = useCallback((key: string) => {
    setReceiptExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const onToggleProductionExpand = useCallback((key: string) => {
    setProductionExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const onToggleIssueExpand = useCallback((key: string) => {
    setIssueExpanded((prev) => {
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

  const card = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const filterParams: CommonReportFilterParams = useMemo(
    () => commonReportFiltersToParams(filters),
    [filters]
  );

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports', href: '/reports' },
          { label: 'Stock Management Report' },
        ]}
        className="mb-4"
      />
      {/* Filter section commented out for now. To restore, add filters={...} prop to ListPageLayout with FilterComponent (columns, config, onFilterChange, initialFilters). */}
      <ListPageLayout
        title="Stock Management Report"
        description="View receipt details, production, issue details and balance stock. Use filters and click Apply to refresh."
      >
        {loading && (
          <div className={`rounded-xl border p-8 text-center ${card}`}>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-500 border-t-transparent mx-auto mb-3" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading report…</p>
          </div>
        )}
        {!loading && error && (
          <div className={`rounded-xl border p-6 ${card}`}>
            <p className={isDarkMode ? 'text-red-300' : 'text-red-600'}>{error}</p>
          </div>
        )}
        {!loading && !error && data && (
          <div className={`rounded-xl border overflow-hidden ${card}`}>
            <StockManagementReceiptSection
              data={data.receipt_details}
              expanded={receiptExpanded}
              onToggleExpand={onToggleReceiptExpand}
              hasBorderBottom
            />
            <StockManagementProductionSection
              data={data.production}
              expanded={productionExpanded}
              onToggleExpand={onToggleProductionExpand}
              hasBorderBottom
            />
            <StockManagementIssueSection
              data={data.issue_details}
              filtersApplied={filterParams}
              expanded={issueExpanded}
              onToggleExpand={onToggleIssueExpand}
              hasBorderBottom
            />
            <StockManagementBalanceStockSection data={data.balance_stock} hasBorderBottom={false} />
          </div>
        )}
        {!loading && !error && !data && (
          <div className={`rounded-xl border p-6 ${card}`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No report data.</p>
          </div>
        )}
      </ListPageLayout>
    </div>
  );
}
