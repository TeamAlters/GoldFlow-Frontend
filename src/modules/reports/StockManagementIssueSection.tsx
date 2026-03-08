import { useUIStore } from '../../stores/ui.store';
import { formatReportNum } from '../../shared/utils/reportFormatters';
import { ItemGroupTree } from '../../shared/components/ItemGroupTree';
import type { StockManagementIssueDetails } from './stockManagementReport.api';
import type { CommonReportFilterParams } from '../../shared/utils/reportFilters';

export interface StockManagementIssueSectionProps {
  data: StockManagementIssueDetails;
  filtersApplied?: CommonReportFilterParams;
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  hasBorderBottom?: boolean;
}

export function StockManagementIssueSection({
  data,
  filtersApplied,
  expanded,
  onToggleExpand,
  hasBorderBottom = true,
}: StockManagementIssueSectionProps) {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const borderBottom = hasBorderBottom ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : '';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const blockCard = isDarkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-50 border-gray-200';
  const titleClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const hasFilters =
    Boolean(filtersApplied?.customer) ||
    Boolean(filtersApplied?.date_from) ||
    Boolean(filtersApplied?.date_to) ||
    Boolean(filtersApplied?.purity);

  return (
    <div className={`px-4 py-4 ${borderBottom}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
        <span className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Issue Details</span>
        <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${labelClass}`}>
          <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.total_balance_weight)}</span></span>
          <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.total_balance_fine_weight)}</span></span>
        </span>
      </div>
      {hasFilters && (
        <p className={`text-sm mb-3 ${isDarkMode ? 'text-amber-300/90' : 'text-amber-700'}`}>
          Filtered by customer / date / purity
        </p>
      )}
      <div className={`rounded-lg border p-4 ${blockCard}`}>
        <ItemGroupTree
          itemGroups={data.item_groups ?? []}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          isDarkMode={isDarkMode}
          detailVariant="issue"
          sectionId="issue"
        />
      </div>
    </div>
  );
}
