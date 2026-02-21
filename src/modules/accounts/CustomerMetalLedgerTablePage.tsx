import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useUIStore } from '../../stores/ui.store';

type LedgerRow = {
  id: string;
  weight: string;
  balanceWeight: string;
  purity: string;
  description: string;
  reference: string;
};

let ledgerRowIdCounter = 0;

function toNum(v: string): number {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : 0;
}

function sanitizeDecimalInput(value: string): string {
  const v = value.replace(/[^0-9.\-]/g, '');
  const parts = v.split('.');
  if (parts.length <= 1) return v;
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

function makeLedgerRow(partial?: Partial<LedgerRow>): LedgerRow {
  ledgerRowIdCounter += 1;
  return {
    id: `ledger-${Date.now()}-${ledgerRowIdCounter}`,
    weight: '',
    balanceWeight: '',
    purity: '',
    description: '',
    reference: '',
    ...partial,
  };
}

export default function CustomerMetalLedgerTablePage() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>(() => [
    makeLedgerRow({ purity: '100' }),
    makeLedgerRow({ purity: '99.5' }),
    makeLedgerRow({ purity: '91.8' }),
    makeLedgerRow({ purity: '92' }),
    makeLedgerRow({ purity: '75' }),
  ]);

  const ledgerDerived = useMemo(() => {
    const rowFineWeights = ledgerRows.map((r) => {
      const fine = toNum(r.weight) * (toNum(r.purity) / 100);
      return Number.isFinite(fine) ? fine : 0;
    });
    const totals = ledgerRows.reduce(
      (acc, r, idx) => {
        acc.weight += toNum(r.weight);
        acc.balanceWeight += toNum(r.balanceWeight);
        acc.fineWeight += rowFineWeights[idx] ?? 0;
        return acc;
      },
      { weight: 0, balanceWeight: 0, fineWeight: 0 }
    );
    return { rowFineWeights, totals };
  }, [ledgerRows]);

  const setLedger = (rowId: string, key: keyof Omit<LedgerRow, 'id'>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const value = key === 'description' || key === 'reference' ? raw : sanitizeDecimalInput(raw);
      setLedgerRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
    };

  const handleAddLedgerRow = () => {
    setLedgerRows((prev) => [...prev, makeLedgerRow()]);
  };

  const handleDeleteLedgerRow = (rowId: string) => {
    setLedgerRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      ledger_lines: ledgerRows.map((r, idx) => ({
        sr_no: idx + 1,
        weight: r.weight,
        balance_weight: r.balanceWeight,
        purity: r.purity,
        fine_weight: (ledgerDerived.rowFineWeights[idx] ?? 0).toFixed(3),
        description: r.description,
        reference: r.reference,
      })),
      ledger_totals: {
        total_weight: ledgerDerived.totals.weight.toFixed(3),
        total_balance_weight: ledgerDerived.totals.balanceWeight.toFixed(3),
        total_fine_weight: ledgerDerived.totals.fineWeight.toFixed(3),
      },
    };

    // eslint-disable-next-line no-console
    console.log('[CustomerMetalLedgerTable] payload:', payload);
  };

  const inputBase =
    'w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2';

  const inputClass = `${inputBase} ${
    isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  const sectionClass = `border rounded-lg p-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

  const sectionTitleClass = `text-lg font-semibold mb-4 pb-2 border-b ${
    isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
  }`;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Customer Metal Ledger - Table
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Maintain metal ledger lines.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="space-y-6">
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Metal Ledger</h3>
            <div
              className={`overflow-hidden rounded-lg border ${
                isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-300 bg-white'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? 'bg-slate-700 text-gray-100' : 'bg-teal-700 text-white'}>
                      {[
                        'Sr.No.',
                        'Weight',
                        'Balance Weight',
                        'Purity',
                        'Fine Weight',
                        'Description',
                        'Refrence',
                        '',
                      ].map((h, i) => (
                        <th key={i} className="px-3 py-2 font-semibold whitespace-nowrap border-r border-black/10">
                          <div className="flex items-center gap-2">
                            <span>{h}</span>
                            {h && h !== '' && h !== 'Fine Weight' && h !== 'Description' && h !== 'Refrence' && (
                              <svg
                                className="w-3.5 h-3.5 opacity-80"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden
                              >
                                <path d="M5.5 7.5L10 12l4.5-4.5" />
                              </svg>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {ledgerRows.map((row, index) => {
                      const fine = ledgerDerived.rowFineWeights[index] ?? 0;
                      return (
                        <tr
                          key={row.id}
                          className={
                            isDarkMode
                              ? index % 2 === 0
                                ? 'bg-gray-900/20'
                                : 'bg-gray-900/10'
                              : 'bg-sky-100/40'
                          }
                        >
                          <td className="px-3 py-2 text-center whitespace-nowrap border-r border-black/10">
                            {index + 1}
                          </td>
                          <td className="px-2 py-1 border-r border-black/10">
                            <input className={inputClass} value={row.weight} onChange={setLedger(row.id, 'weight')} placeholder="0" />
                          </td>
                          <td className="px-2 py-1 border-r border-black/10">
                            <input className={inputClass} value={row.balanceWeight} onChange={setLedger(row.id, 'balanceWeight')} placeholder="0" />
                          </td>
                          <td className="px-2 py-1 border-r border-black/10">
                            <input className={inputClass} value={row.purity} onChange={setLedger(row.id, 'purity')} placeholder="0" />
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap border-r border-black/10">
                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>
                              {fine ? fine.toFixed(3) : '0'}
                            </span>
                          </td>
                          <td className="px-2 py-1 border-r border-black/10 min-w-[220px]">
                            <input className={inputClass} value={row.description} onChange={setLedger(row.id, 'description')} placeholder="" />
                          </td>
                          <td className="px-2 py-1 border-r border-black/10 min-w-[200px]">
                            <input className={inputClass} value={row.reference} onChange={setLedger(row.id, 'reference')} placeholder="" />
                          </td>
                          <td className="px-2 py-1 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteLedgerRow(row.id)}
                              className={
                                isDarkMode
                                  ? 'px-2 py-1 text-xs font-semibold rounded-md text-red-300 hover:bg-red-500/10'
                                  : 'px-2 py-1 text-xs font-semibold rounded-md text-red-700 hover:bg-red-50'
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className={isDarkMode ? 'bg-slate-800' : 'bg-sky-200/60'}>
                      <td className="px-3 py-2 font-semibold border-r border-black/10">Total</td>
                      <td className="px-3 py-2 font-semibold text-right border-r border-black/10">
                        {ledgerDerived.totals.weight.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-right border-r border-black/10">
                        {ledgerDerived.totals.balanceWeight.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 border-r border-black/10" />
                      <td className="px-3 py-2 font-semibold text-right border-r border-black/10">
                        {ledgerDerived.totals.fineWeight.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 border-r border-black/10" />
                      <td className="px-3 py-2 border-r border-black/10" />
                      <td className="px-3 py-2" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleAddLedgerRow}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Add Row
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
