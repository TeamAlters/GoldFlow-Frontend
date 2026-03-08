import { useUIStore } from '../../stores/ui.store';
import { formatReportNum } from '../../shared/utils/reportFormatters';
import { ItemGroupTree } from '../../shared/components/ItemGroupTree';
import type { StockManagementReceiptDetails } from './stockManagementReport.api';

export interface StockManagementReceiptSectionProps {
  data: StockManagementReceiptDetails;
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  /** When true, section is not the last block so border-b is applied */
  hasBorderBottom?: boolean;
}

export function StockManagementReceiptSection({
  data,
  expanded,
  onToggleExpand,
  hasBorderBottom = true,
}: StockManagementReceiptSectionProps) {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const borderBottom = hasBorderBottom ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : '';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const blockCard = isDarkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-50 border-gray-200';
  const titleClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';

  return (
    <div className={`px-4 py-4 ${borderBottom}`}>
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 ${labelClass}`}>
        <span className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Receipt Details</span>
        <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.total_balance_weight)}</span></span>
        <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.total_balance_fine_weight)}</span></span>
      </div>

      <div className="space-y-5">
        <div className={`rounded-lg border p-4 ${blockCard}`}>
          <div className={`text-base font-semibold mb-3 ${titleClass}`}>Metal Ledger Receipt (IN)</div>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4 ${labelClass}`}>
            <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.metal_ledger_receipt_in.total_balance_weight)}</span></span>
            <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.metal_ledger_receipt_in.total_balance_fine_weight)}</span></span>
          </div>
          <ItemGroupTree
            itemGroups={data.metal_ledger_receipt_in.item_groups ?? []}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isDarkMode={isDarkMode}
            detailVariant="receipt"
            sectionId="receipt-in"
          />
        </div>

        <div className={`rounded-lg border p-4 ${blockCard}`}>
          <div className={`text-base font-semibold mb-3 ${titleClass}`}>Additional Weight (OUT)</div>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4 ${labelClass}`}>
            <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.additional_weight_out.total_balance_weight)}</span></span>
            <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.additional_weight_out.total_balance_fine_weight)}</span></span>
          </div>
          <ItemGroupTree
            itemGroups={data.additional_weight_out.item_groups ?? []}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isDarkMode={isDarkMode}
            detailVariant="receipt"
            sectionId="receipt-out"
          />
        </div>
      </div>
    </div>
  );
}
