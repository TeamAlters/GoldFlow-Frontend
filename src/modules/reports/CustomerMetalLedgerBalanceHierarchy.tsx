import type {
  CustomerMetalLedgerCustomer,
  PurityBreakdownItem,
  ReceiptsOrIssuesBlock,
  CustomerMetalLedgerEntry,
} from './customerMetalLedgerBalanceReport.api';
import { formatReportNum, formatReportDate } from '../../shared/utils/reportFormatters';

function expandKeyCustomer(customer: string): string {
  return `customer-${customer}`;
}

function expandKeyPurity(customer: string, purity: string): string {
  return `customer-${customer}-purity-${purity}`;
}

interface CustomerMetalLedgerBalanceHierarchyProps {
  customers: CustomerMetalLedgerCustomer[];
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  isDarkMode: boolean;
}

function EntryTable({
  entries,
  blockTotals,
  isDarkMode,
}: {
  entries: CustomerMetalLedgerEntry[];
  blockTotals: ReceiptsOrIssuesBlock;
  isDarkMode: boolean;
}) {
  const containerClass = `overflow-x-auto rounded-lg border w-full ${
    isDarkMode ? 'border-gray-600' : 'border-gray-200'
  }`;
  const thClass = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
    isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-[#F2EFE9] text-gray-800 border-gray-200'
  }`;
  const tdClass = `px-4 py-3 text-sm whitespace-nowrap ${
    isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-900 border-gray-200'
  }`;
  const tfootTr = isDarkMode ? 'bg-gray-700 border-t-2 border-gray-600' : 'bg-[#F2EFE9] border-t-2 border-gray-200';
  const tfootTd = `px-4 py-3 text-sm whitespace-nowrap font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`;

  return (
    <div className={containerClass}>
      <table className="min-w-full">
        <thead>
          <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
            <th className={thClass}>Voucher</th>
            <th className={`${thClass} border-r`}>Type</th>
            <th className={`${thClass} border-r`}>Date</th>
            <th className={`${thClass} border-r`}>Wastage</th>
            <th className={`${thClass} text-right border-r`}>Gross</th>
            <th className={`${thClass} text-right border-r`}>Fine</th>
            <th className={`${thClass} text-right border-r`}>Fine (w/wastage)</th>
            <th className={`${thClass} text-right border-r`}>Amount</th>
            <th className={`${thClass} text-right border-r`}>Final</th>
            <th className={thClass}>Created</th>
          </tr>
        </thead>
        <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
          {entries.map((e, i) => (
            <tr key={`${e.voucher_no}-${i}`}>
              <td className={tdClass}>{e.voucher_no}</td>
              <td className={`${tdClass} border-r`}>{e.transaction_type}</td>
              <td className={`${tdClass} border-r`}>{formatReportDate(e.transaction_date)}</td>
              <td className={`${tdClass} border-r`}>{e.wastage ?? '—'}</td>
              <td className={`${tdClass} text-right border-r`}>{formatReportNum(e.gross_weight)}</td>
              <td className={`${tdClass} text-right border-r`}>{formatReportNum(e.fine_weight)}</td>
              <td className={`${tdClass} text-right border-r`}>{formatReportNum(e.fine_weight_with_wastage)}</td>
              <td className={`${tdClass} text-right border-r`}>{formatReportNum(e.amount)}</td>
              <td className={`${tdClass} text-right border-r`}>{formatReportNum(e.final_amount)}</td>
              <td className={tdClass}>{formatReportDate(e.created_at)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={tfootTr}>
            <td className={`${tfootTd} border-r`} colSpan={4}>Total</td>
            <td className={`${tfootTd} text-right border-r`}>{formatReportNum(blockTotals.total_gross_weight)}</td>
            <td className={`${tfootTd} text-right border-r`}>{formatReportNum(blockTotals.total_fine_weight)}</td>
            <td className={`${tfootTd} text-right border-r`}>{formatReportNum(blockTotals.total_fine_weight_with_wastage)}</td>
            <td className={`${tfootTd} text-right border-r`}>—</td>
            <td className={`${tfootTd} text-right border-r`}>{formatReportNum(blockTotals.total_final_amount)}</td>
            <td className={tfootTd} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function BlockSection({
  title,
  block,
  isDarkMode,
}: {
  title: string;
  block: ReceiptsOrIssuesBlock;
  isDarkMode: boolean;
}) {
  const card = isDarkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-50 border-gray-200';
  const titleClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`rounded-lg border p-4 ${card}`}>
      <div className={`text-base font-semibold mb-3 ${titleClass}`}>{title}</div>
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4 ${labelClass}`}>
        <span><span className="font-medium">Gross Weight:</span> <span className="font-bold">{formatReportNum(block.total_gross_weight)}</span></span>
        <span><span className="font-medium">Fine Weight:</span> <span className="font-bold">{formatReportNum(block.total_fine_weight)}</span></span>
        <span><span className="font-medium">Fine Weight (Wastage):</span> <span className="font-bold">{formatReportNum(block.total_fine_weight_with_wastage)}</span></span>
        <span><span className="font-medium">Final Amount:</span> <span className="font-bold">{formatReportNum(block.total_final_amount)}</span></span>
      </div>
      {block.entries.length > 0 && (
        <EntryTable entries={block.entries} blockTotals={block} isDarkMode={isDarkMode} />
      )}
    </div>
  );
}

export default function CustomerMetalLedgerBalanceHierarchy({
  customers,
  expanded,
  onToggleExpand,
  isDarkMode,
}: CustomerMetalLedgerBalanceHierarchyProps) {
  const card = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const rowHover = isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const chevron = (open: boolean) => (
    <svg
      className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  if (customers.length === 0) {
    return (
      <div className={`rounded-xl border p-8 text-center ${card}`}>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No data. Use filters and click Apply to load the report.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${card}`}>
      {customers.map((c) => {
        const cKey = expandKeyCustomer(c.customer);
        const cOpen = expanded.has(cKey);
        return (
          <div key={cKey} className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
            <button
              type="button"
              onClick={() => onToggleExpand(cKey)}
              className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-left ${rowHover}`}
            >
              {chevron(cOpen)}
              <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span><span className="font-medium">Customer:</span> <span className="font-bold">{c.customer}</span></span>
                <span><span className="font-medium">Balance Weight:</span> <span className="font-bold">{formatReportNum(c.balance_weight)}</span></span>
                <span><span className="font-medium">Fine Weight:</span> <span className="font-bold">{formatReportNum(c.balance_fine_weight)}</span></span>
              </span>
            </button>
            {cOpen &&
              c.purity_breakdown.map((p: PurityBreakdownItem) => {
                const pKey = expandKeyPurity(c.customer, p.purity);
                const pOpen = expanded.has(pKey);
                return (
                  <div
                    key={pKey}
                    className={isDarkMode ? 'border-l-2 border-b border-gray-700 bg-gray-900/40' : 'border-l-2 border-b border-gray-200 bg-gray-50/80'}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleExpand(pKey)}
                      className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 text-left ${rowHover}`}
                    >
                      {chevron(pOpen)}
                      <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span><span className="font-medium">Purity:</span> <span className="font-bold">{p.purity} ({p.purity_percentage}%)</span></span>
                        <span><span className="font-medium">Balance Weight:</span> <span className="font-bold">{formatReportNum(p.balance_gross_weight)}</span></span>
                        <span><span className="font-medium">Fine Weight:</span> <span className="font-bold">{formatReportNum(p.balance_fine_weight)}</span></span>
                      </span>
                    </button>
                    {pOpen && (
                      <div className="px-6 pb-5 pt-3 space-y-5">
                        <BlockSection title="Receipts" block={p.receipts} isDarkMode={isDarkMode} />
                        <BlockSection title="Issues" block={p.issues} isDarkMode={isDarkMode} />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
