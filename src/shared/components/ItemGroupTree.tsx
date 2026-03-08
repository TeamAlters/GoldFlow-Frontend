import { formatReportNum, formatReportDate } from '../utils/reportFormatters';
import type { StockManagementItemTypeGroup } from '../../modules/reports/stockManagementReport.api';
import type { StockManagementReceiptDetailRow, StockManagementIssueDetailRow } from '../../modules/reports/stockManagementReport.api';

export type ItemGroupTreeDetailRow = StockManagementReceiptDetailRow | StockManagementIssueDetailRow;

export interface ItemGroupTreeProps {
  itemGroups: StockManagementItemTypeGroup[];
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  isDarkMode: boolean;
  detailVariant: 'receipt' | 'issue';
  sectionId: string;
}

function buildIgKey(sectionId: string, itemType: string): string {
  return `ig-${sectionId}-${itemType}`;
}
function buildItemKey(sectionId: string, itemType: string, itemName: string): string {
  return `item-${sectionId}-${itemType}-${itemName}`;
}
function buildPurityKey(sectionId: string, itemType: string, itemName: string, purity: string): string {
  return `purity-${sectionId}-${itemType}-${itemName}-${purity}`;
}

const tableContainerClass = (dark: boolean) =>
  `overflow-x-auto rounded-lg border w-full ${dark ? 'border-gray-600' : 'border-gray-200'}`;
const thClass = (dark: boolean) =>
  `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
    dark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-[#F2EFE9] text-gray-800 border-gray-200'
  }`;
const tdClass = (dark: boolean) =>
  `px-4 py-3 text-sm whitespace-nowrap ${dark ? 'text-gray-300 border-gray-600' : 'text-gray-900 border-gray-200'}`;
const tfootTr = (dark: boolean) => (dark ? 'bg-gray-700 border-t-2 border-gray-600' : 'bg-[#F2EFE9] border-t-2 border-gray-200');
const tfootTd = (dark: boolean) => `px-4 py-3 text-sm whitespace-nowrap font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ItemGroupTree({
  itemGroups,
  expanded,
  onToggleExpand,
  isDarkMode,
  detailVariant,
  sectionId,
}: ItemGroupTreeProps) {
  const rowHover = isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const nestedRow = isDarkMode ? 'border-l-2 border-b border-gray-700 bg-gray-900/40' : 'border-l-2 border-b border-gray-200 bg-gray-50/80';

  if (!itemGroups?.length) {
    return (
      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        No data
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {itemGroups.map((ig) => {
        const igKey = buildIgKey(sectionId, ig.item_type);
        const isIgExpanded = expanded.has(igKey);
        return (
          <div key={igKey} className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
            <button
              type="button"
              onClick={() => onToggleExpand(igKey)}
              aria-expanded={isIgExpanded}
              aria-label={`Item group ${ig.item_type} expand`}
              className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-left ${rowHover}`}
            >
              <Chevron open={isIgExpanded} />
              <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span><span className="font-medium">Item Type:</span> <span className="font-bold">{ig.item_type}</span></span>
                <span><span className="font-medium">Total Weight:</span> <span className="font-bold">{formatReportNum(ig.total_weight)}</span></span>
                <span><span className="font-medium">Total Fine Weight:</span> <span className="font-bold">{formatReportNum(ig.total_fine_weight)}</span></span>
              </span>
            </button>
            {isIgExpanded &&
              ig.items?.map((item) => {
                const itemKey = buildItemKey(sectionId, ig.item_type, item.item_name);
                const isItemExpanded = expanded.has(itemKey);
                return (
                  <div key={itemKey} className={nestedRow}>
                    <button
                      type="button"
                      onClick={() => onToggleExpand(itemKey)}
                      aria-expanded={isItemExpanded}
                      aria-label={`Item ${item.item_name} expand`}
                      className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 text-left ${rowHover}`}
                    >
                      <Chevron open={isItemExpanded} />
                      <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span><span className="font-medium">Item Name:</span> <span className="font-bold">{item.item_name}</span></span>
                        <span><span className="font-medium">Total Weight:</span> <span className="font-bold">{formatReportNum(item.total_weight)}</span></span>
                        <span><span className="font-medium">Total Fine Weight:</span> <span className="font-bold">{formatReportNum(item.total_fine_weight)}</span></span>
                      </span>
                    </button>
                    {isItemExpanded &&
                      item.purities?.map((p) => {
                        const purityKey = buildPurityKey(sectionId, ig.item_type, item.item_name, p.purity);
                        const isPurityExpanded = expanded.has(purityKey);
                        return (
                          <div key={purityKey} className={nestedRow}>
                            <button
                              type="button"
                              onClick={() => onToggleExpand(purityKey)}
                              aria-expanded={isPurityExpanded}
                              aria-label={`Purity ${p.purity} expand`}
                              className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 text-left ${rowHover}`}
                            >
                              <Chevron open={isPurityExpanded} />
                              <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <span><span className="font-medium">Purity:</span> <span className="font-bold">{p.purity}</span></span>
                                <span><span className="font-medium">Total Weight:</span> <span className="font-bold">{formatReportNum(p.total_weight)}</span></span>
                                <span><span className="font-medium">Total Fine Weight:</span> <span className="font-bold">{formatReportNum(p.total_fine_weight)}</span></span>
                              </span>
                            </button>
                            {isPurityExpanded && (
                              <div className="px-6 pb-5 pt-3">
                                {p.details?.length ? (
                                  detailVariant === 'receipt' ? (
                                    <ReceiptDetailsTable details={p.details as StockManagementReceiptDetailRow[]} isDarkMode={isDarkMode} />
                                  ) : (
                                    <IssueDetailsTable details={p.details as StockManagementIssueDetailRow[]} isDarkMode={isDarkMode} />
                                  )
                                ) : (
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No data</p>
                                )}
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
      })}
    </div>
  );
}

function sumWeight(details: StockManagementReceiptDetailRow[]): string {
  let w = 0;
  let fw = 0;
  details.forEach((r) => {
    const nw = Number(r.weight);
    const nfw = Number(r.fine_weight);
    if (Number.isFinite(nw)) w += nw;
    if (Number.isFinite(nfw)) fw += nfw;
  });
  return `${w.toFixed(4)}`;
}
function sumFineWeight(details: StockManagementReceiptDetailRow[]): string {
  let fw = 0;
  details.forEach((r) => {
    const n = Number(r.fine_weight);
    if (Number.isFinite(n)) fw += n;
  });
  return `${fw.toFixed(4)}`;
}
function issueSumGross(details: StockManagementIssueDetailRow[]): string {
  let s = 0;
  details.forEach((r) => { const n = Number(r.gross_weight); if (Number.isFinite(n)) s += n; });
  return `${s.toFixed(4)}`;
}
function issueSumFine(details: StockManagementIssueDetailRow[]): string {
  let s = 0;
  details.forEach((r) => { const n = Number(r.fine_weight); if (Number.isFinite(n)) s += n; });
  return `${s.toFixed(4)}`;
}

function ReceiptDetailsTable({
  details,
  isDarkMode,
}: {
  details: StockManagementReceiptDetailRow[];
  isDarkMode: boolean;
}) {
  const container = tableContainerClass(isDarkMode);
  const th = thClass(isDarkMode);
  const td = tdClass(isDarkMode);
  const borderR = isDarkMode ? 'border-r border-gray-600' : 'border-r border-gray-200';
  const totalWeight = details.length ? sumWeight(details) : '0.0000';
  const totalFineWeight = details.length ? sumFineWeight(details) : '0.0000';

  return (
    <div className={container}>
      <table className="min-w-full">
        <thead>
          <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
            <th className={th}>Weight</th>
            <th className={`${th} border-r`}>Fine Weight</th>
            <th className={`${th} border-r`}>Metal Ledger</th>
            <th className={`${th} border-r`}>Melting Lot</th>
            <th className={`${th} border-r`}>Created By</th>
            <th className={`${th} border-r`}>Created At</th>
            <th className={`${th} border-r`}>ID</th>
            <th className={th}>Transaction Type</th>
          </tr>
        </thead>
        <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
          {details.map((row, i) => (
            <tr key={row.id || i}>
              <td className={td}>{formatReportNum(row.weight)}</td>
              <td className={`${td} border-r`}>{formatReportNum(row.fine_weight)}</td>
              <td className={`${td} border-r`}>{row.metal_ledger ?? '—'}</td>
              <td className={`${td} border-r`}>{row.melting_lot ?? '—'}</td>
              <td className={`${td} border-r`}>{row.created_by}</td>
              <td className={`${td} border-r`}>{formatReportDate(row.created_at)}</td>
              <td className={`${td} border-r`}>{row.id}</td>
              <td className={td}>{row.transaction_type}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={tfootTr(isDarkMode)}>
            <td className={`${tfootTd(isDarkMode)} border-r`}>{formatReportNum(totalWeight)}</td>
            <td className={`${tfootTd(isDarkMode)} border-r`}>{formatReportNum(totalFineWeight)}</td>
            <td className={`${tfootTd(isDarkMode)} border-r`} colSpan={6}>Total</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function IssueDetailsTable({
  details,
  isDarkMode,
}: {
  details: StockManagementIssueDetailRow[];
  isDarkMode: boolean;
}) {
  const container = tableContainerClass(isDarkMode);
  const th = thClass(isDarkMode);
  const td = tdClass(isDarkMode);
  const borderR = isDarkMode ? 'border-r border-gray-600' : 'border-r border-gray-200';
  const totalGross = details.length ? issueSumGross(details) : '0.0000';
  const totalFine = details.length ? issueSumFine(details) : '0.0000';

  return (
    <div className={container}>
      <table className="min-w-full">
        <thead>
          <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
            <th className={th}>Gross Weight</th>
            <th className={`${th} border-r`}>Fine Weight</th>
            <th className={`${th} border-r`}>Voucher No</th>
            <th className={th}>Job Cards</th>
          </tr>
        </thead>
        <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
          {details.map((row, i) => (
            <tr key={`${row.voucher_no}-${i}`}>
              <td className={td}>{formatReportNum(row.gross_weight)}</td>
              <td className={`${td} border-r`}>{formatReportNum(row.fine_weight)}</td>
              <td className={`${td} border-r`}>{row.voucher_no}</td>
              <td className={td}>
                {Array.isArray(row.job_cards) && row.job_cards.length > 0
                  ? row.job_cards.join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={tfootTr(isDarkMode)}>
            <td className={`${tfootTd(isDarkMode)} border-r`}>{formatReportNum(totalGross)}</td>
            <td className={`${tfootTd(isDarkMode)} border-r`}>{formatReportNum(totalFine)}</td>
            <td className={`${tfootTd(isDarkMode)} border-r`}>Total</td>
            <td className={tfootTd(isDarkMode)} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
