import { useUIStore } from '../../stores/ui.store';
import { formatReportNum } from '../../shared/utils/reportFormatters';
import type { StockManagementBalanceStock } from './stockManagementReport.api';

export interface StockManagementBalanceStockSectionProps {
  data: StockManagementBalanceStock;
  /** When false, no border-b (last section) */
  hasBorderBottom?: boolean;
}

export function StockManagementBalanceStockSection({ data, hasBorderBottom = false }: StockManagementBalanceStockSectionProps) {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const borderBottom = hasBorderBottom ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : '';
  const bw = Number(String(data.balance_weight).trim());
  const bfw = Number(String(data.balance_fine_weight).trim());
  const isSettled = Number.isFinite(bw) && Number.isFinite(bfw) && bw === 0 && bfw === 0;

  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const blockCard = isDarkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-50 border-gray-200';
  const titleClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';

  return (
    <div className={`px-4 py-4 ${borderBottom}`}>
      <div className={`rounded-lg border p-4 ${blockCard}`}>
        <div className={`text-base font-semibold mb-3 ${titleClass}`}>Balance Stock</div>
        {isSettled ? (
          <div className={`text-sm ${labelClass}`}>
            <p className="font-medium">Fully accounted</p>
            <p className="opacity-90">Stock settled</p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm ${labelClass}`}>
            <span><span className="font-medium">Balance Weight:</span> <span className="font-bold">{formatReportNum(data.balance_weight)}</span></span>
            <span><span className="font-medium">Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.balance_fine_weight)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
