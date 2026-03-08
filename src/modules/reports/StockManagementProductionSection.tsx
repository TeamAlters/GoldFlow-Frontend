import { useUIStore } from '../../stores/ui.store';
import { formatReportNum } from '../../shared/utils/reportFormatters';
import type {
  StockManagementProduction,
  StockManagementJobCardRow,
  StockManagementPoolInRow,
  StockManagementPoolOutRow,
} from './stockManagementReport.api';

export interface StockManagementProductionSectionProps {
  data: StockManagementProduction;
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  hasBorderBottom?: boolean;
}

function buildProductKey(product: string): string {
  return `prod-dept-product-${product}`;
}
function buildPurityKey(product: string, purity: string): string {
  return `prod-dept-purity-${product}-${purity}`;
}
function buildPoolPurityKey(purity: string): string {
  return `prod-pool-purity-${purity}`;
}

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
const borderR = (dark: boolean) => (dark ? 'border-r border-gray-600' : 'border-r border-gray-200');

export function StockManagementProductionSection({
  data,
  expanded,
  onToggleExpand,
  hasBorderBottom = true,
}: StockManagementProductionSectionProps) {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const borderBottom = hasBorderBottom ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : '';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const blockCard = isDarkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-50 border-gray-200';
  const titleClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const rowHover = isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const nestedRow = isDarkMode ? 'border-l-2 border-b border-gray-700 bg-gray-900/40' : 'border-l-2 border-b border-gray-200 bg-gray-50/80';

  return (
    <div className={`px-4 py-4 ${borderBottom}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
        <span className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Production</span>
        <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${labelClass}`}>
          <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.total_balance_weight)}</span></span>
          <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.total_balance_fine_weight)}</span></span>
        </span>
      </div>

      <div className="space-y-5">
        <div className={`rounded-lg border p-4 ${blockCard}`}>
          <div className={`text-base font-semibold mb-3 ${titleClass}`}>Department Production</div>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4 ${labelClass}`}>
            <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.department_production.total_balance_weight)}</span></span>
            <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.department_production.total_balance_fine_weight)}</span></span>
          </div>
          {!(data.department_production.products ?? []).length ? (
            <p className={`text-sm ${labelClass}`}>No data</p>
          ) : (
            <div className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
              {(data.department_production.products ?? []).map((prod) => {
                const prodKey = buildProductKey(prod.product);
                const isProdExpanded = expanded.has(prodKey);
                return (
                  <div key={prodKey}>
                    <button
                      type="button"
                      onClick={() => onToggleExpand(prodKey)}
                      aria-expanded={isProdExpanded}
                      aria-label={`Product ${prod.product} expand`}
                      className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-left ${rowHover}`}
                    >
                      <Chevron open={isProdExpanded} />
                      <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span><span className="font-medium">Product:</span> <span className="font-bold">{prod.product}</span></span>
                        <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(prod.total_balance_weight)}</span></span>
                        <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(prod.total_balance_fine_weight)}</span></span>
                      </span>
                    </button>
                    {isProdExpanded &&
                      (prod.purities ?? []).map((p) => {
                        const purityKey = buildPurityKey(prod.product, p.purity);
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
                                <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(p.total_balance_weight)}</span></span>
                                <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(p.total_balance_fine_weight)}</span></span>
                              </span>
                            </button>
                            {isPurityExpanded && (
                              <div className="px-6 pb-5 pt-3">
                                <JobCardsTable jobCards={p.job_cards ?? []} isDarkMode={isDarkMode} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`rounded-lg border p-4 ${blockCard}`}>
          <div className={`text-base font-semibold mb-3 ${titleClass}`}>Pool Balance</div>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4 ${labelClass}`}>
            <span><span className="font-medium">Total Balance Weight:</span> <span className="font-bold">{formatReportNum(data.pool_balance.total_balance_weight)}</span></span>
            <span><span className="font-medium">Total Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(data.pool_balance.total_balance_fine_weight)}</span></span>
          </div>
          {!(data.pool_balance.purities ?? []).length ? (
            <p className={`text-sm ${labelClass}`}>No data</p>
          ) : (
            <div className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
              {(data.pool_balance.purities ?? []).map((p) => {
                const purityKey = buildPoolPurityKey(p.purity);
                const isExpanded = expanded.has(purityKey);
                return (
                  <div key={purityKey}>
                    <button
                      type="button"
                      onClick={() => onToggleExpand(purityKey)}
                      aria-expanded={isExpanded}
                      aria-label={`Pool purity ${p.purity} expand`}
                      className={`w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-left ${rowHover}`}
                    >
                      <Chevron open={isExpanded} />
                      <span className={`inline-flex flex-wrap items-center gap-x-6 gap-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span><span className="font-medium">Purity:</span> <span className="font-bold">{p.purity}</span></span>
                        <span><span className="font-medium">Balance Weight:</span> <span className="font-bold">{formatReportNum(p.balance_weight)}</span></span>
                        <span><span className="font-medium">Balance Fine Weight:</span> <span className="font-bold">{formatReportNum(p.balance_fine_weight)}</span></span>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-5 pt-3 space-y-5">
                        <PoolInTable rows={p.in_details ?? []} isDarkMode={isDarkMode} />
                        <PoolOutTable rows={p.out_details ?? []} isDarkMode={isDarkMode} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCardsTable({ jobCards, isDarkMode }: { jobCards: StockManagementJobCardRow[]; isDarkMode: boolean }) {
  const container = tableContainerClass(isDarkMode);
  const th = thClass(isDarkMode);
  const td = tdClass(isDarkMode);
  const br = borderR(isDarkMode);
  let sumW = 0;
  let sumFw = 0;
  jobCards.forEach((r) => {
    const w = Number(r.balance_weight);
    const fw = Number(r.balance_fine_weight);
    if (Number.isFinite(w)) sumW += w;
    if (Number.isFinite(fw)) sumFw += fw;
  });

  return (
    <div className={container}>
      <table className="min-w-full">
        <thead>
          <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
            <th className={th}>Name</th>
            <th className={`${th} ${br}`}>Balance Weight</th>
            <th className={`${th} ${br}`}>Balance Fine Weight</th>
            <th className={`${th} ${br}`}>Department</th>
            <th className={`${th} ${br}`}>Department Group</th>
            <th className={`${th} ${br}`}>Design</th>
            <th className={`${th} ${br}`}>Melting Lot</th>
            <th className={th}>Parent Melting Lot</th>
          </tr>
        </thead>
        <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
          {jobCards.map((row, i) => (
            <tr key={row.name + i}>
              <td className={td}>{row.name}</td>
              <td className={`${td} ${br}`}>{formatReportNum(row.balance_weight)}</td>
              <td className={`${td} ${br}`}>{formatReportNum(row.balance_fine_weight)}</td>
              <td className={`${td} ${br}`}>{row.department}</td>
              <td className={`${td} ${br}`}>{row.department_group}</td>
              <td className={`${td} ${br}`}>{row.design}</td>
              <td className={`${td} ${br}`}>{row.melting_lot ?? '—'}</td>
              <td className={td}>{row.parent_melting_lot ?? '—'}</td>
            </tr>
          ))}
        </tbody>
        {jobCards.length > 0 && (
          <tfoot>
            <tr className={tfootTr(isDarkMode)}>
              <td className={`${tfootTd(isDarkMode)} ${br}`}>Total</td>
              <td className={`${tfootTd(isDarkMode)} ${br}`}>{formatReportNum(String(sumW.toFixed(4)))}</td>
              <td className={`${tfootTd(isDarkMode)} ${br}`}>{formatReportNum(String(sumFw.toFixed(4)))}</td>
              <td className={tfootTd(isDarkMode)} colSpan={5} />
            </tr>
          </tfoot>
        )}
      </table>
      {!jobCards.length && (
        <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No data</p>
      )}
    </div>
  );
}

function PoolInTable({ rows, isDarkMode }: { rows: StockManagementPoolInRow[]; isDarkMode: boolean }) {
  const container = tableContainerClass(isDarkMode);
  const th = thClass(isDarkMode);
  const td = tdClass(isDarkMode);
  const br = borderR(isDarkMode);
  let sumW = 0;
  let sumFw = 0;
  rows.forEach((r) => {
    const w = Number(r.weight);
    const fw = Number(r.fine_weight);
    if (Number.isFinite(w)) sumW += w;
    if (Number.isFinite(fw)) sumFw += fw;
  });

  return (
    <div>
      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>IN transactions</p>
      <div className={container}>
        <table className="min-w-full">
          <thead>
            <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
              <th className={th}>Transaction Type</th>
              <th className={`${th} ${br}`}>Item</th>
              <th className={`${th} ${br}`}>Weight</th>
              <th className={`${th} ${br}`}>Fine Weight</th>
              <th className={`${th} ${br}`}>Job Card</th>
              <th className={`${th} ${br}`}>Metal Ledger</th>
              <th className={th}>ID</th>
            </tr>
          </thead>
          <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
            {rows.map((row, i) => (
              <tr key={row.id + i}>
                <td className={td}>{row.transaction_type}</td>
                <td className={`${td} ${br}`}>{row.item ?? '—'}</td>
                <td className={`${td} ${br}`}>{formatReportNum(row.weight)}</td>
                <td className={`${td} ${br}`}>{formatReportNum(row.fine_weight)}</td>
                <td className={`${td} ${br}`}>{row.job_card ?? '—'}</td>
                <td className={`${td} ${br}`}>{row.metal_ledger ?? '—'}</td>
                <td className={td}>{row.id}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className={tfootTr(isDarkMode)}>
                <td className={`${tfootTd(isDarkMode)} ${br}`}>Total</td>
                <td className={`${tfootTd(isDarkMode)} ${br}`} />
                <td className={`${tfootTd(isDarkMode)} ${br}`}>{formatReportNum(String(sumW.toFixed(4)))}</td>
                <td className={`${tfootTd(isDarkMode)} ${br}`}>{formatReportNum(String(sumFw.toFixed(4)))}</td>
                <td className={tfootTd(isDarkMode)} colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
        {!rows.length && (
          <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No data</p>
        )}
      </div>
    </div>
  );
}

function PoolOutTable({ rows, isDarkMode }: { rows: StockManagementPoolOutRow[]; isDarkMode: boolean }) {
  const container = tableContainerClass(isDarkMode);
  const th = thClass(isDarkMode);
  const td = tdClass(isDarkMode);
  const br = borderR(isDarkMode);
  let sumW = 0;
  let sumFw = 0;
  rows.forEach((r) => {
    const w = Number(r.weight);
    const fw = Number(r.fine_weight);
    if (Number.isFinite(w)) sumW += w;
    if (Number.isFinite(fw)) sumFw += fw;
  });

  return (
    <div>
      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>OUT transactions</p>
      <div className={container}>
        <table className="min-w-full">
          <thead>
            <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
              <th className={th}>Transaction Type</th>
              <th className={`${th} ${br}`}>Item</th>
              <th className={`${th} ${br}`}>Weight</th>
              <th className={`${th} ${br}`}>Fine Weight</th>
              <th className={`${th} ${br}`}>Melting Lot</th>
              <th className={`${th} ${br}`}>Metal Ledger</th>
              <th className={th}>ID</th>
            </tr>
          </thead>
          <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
            {rows.map((row, i) => (
              <tr key={row.id + i}>
                <td className={td}>{row.transaction_type}</td>
                <td className={`${td} ${br}`}>{row.item ?? '—'}</td>
                <td className={`${td} ${br}`}>{formatReportNum(row.weight)}</td>
                <td className={`${td} ${br}`}>{formatReportNum(row.fine_weight)}</td>
                <td className={`${td} ${br}`}>{row.melting_lot ?? '—'}</td>
                <td className={`${td} ${br}`}>{row.metal_ledger ?? '—'}</td>
                <td className={td}>{row.id}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className={tfootTr(isDarkMode)}>
                <td className={`${tfootTd(isDarkMode)} ${br}`}>Total</td>
                <td className={`${tfootTd(isDarkMode)} ${br}`} />
                <td className={`${tfootTd(isDarkMode)} ${br}`}>{formatReportNum(String(sumW.toFixed(4)))}</td>
                <td className={`${tfootTd(isDarkMode)} ${br}`}>{formatReportNum(String(sumFw.toFixed(4)))}</td>
                <td className={tfootTd(isDarkMode)} colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
        {!rows.length && (
          <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No data</p>
        )}
      </div>
    </div>
  );
}
