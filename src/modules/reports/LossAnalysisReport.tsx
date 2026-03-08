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
  const isDarkMode = useUIStore((s: { isDarkMode: boolean }) => s.isDarkMode);

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

  const textClass = `w-full px-3 py-2 text-sm text-center bg-transparent border-none ${
    isDarkMode ? 'text-white' : 'text-gray-900'
  }`;

  const sectionClass = `border rounded-lg p-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
  }`;


  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Metal Pool - Table
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Maintain metal pool lines.
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
          
            <div
              className={`overflow-hidden rounded-lg border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300 bg-white'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-teal-700 text-white'}>
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
                        <th key={i} className={`px-3 py-2 font-semibold whitespace-nowrap border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
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
                                ? 'bg-gray-800/50'
                                : 'bg-gray-800/30'
                              : 'bg-sky-100/40'
                          }
                        >
                          <td className={`px-3 py-2 text-center whitespace-nowrap border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                            {index + 1}
                          </td>
                          <td className={`px-2 py-1 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                            <input className={textClass} value={row.weight} onChange={setLedger(row.id, 'weight')} placeholder="0" />
                          </td>
                          <td className={`px-2 py-1 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                            <input className={textClass} value={row.balanceWeight} onChange={setLedger(row.id, 'balanceWeight')} placeholder="0" />
                          </td>
                          <td className={`px-2 py-1 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                            <input className={textClass} value={row.purity} onChange={setLedger(row.id, 'purity')} placeholder="0" />
                          </td>
                          <td className={`px-3 py-2 text-right whitespace-nowrap border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                            <span className={isDarkMode ? 'text-white font-medium' : 'text-gray-900'}>
                              {fine ? fine.toFixed(3) : '0'}
                            </span>
                          </td>
                          <td className={`px-2 py-1 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} min-w-[220px]`}>
                            <input className={textClass} value={row.description} onChange={setLedger(row.id, 'description')} placeholder="" />
                          </td>
                          <td className={`px-2 py-1 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} min-w-[200px]`}>
                            <input className={textClass} value={row.reference} onChange={setLedger(row.id, 'reference')} placeholder="" />
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
                    <tr className={isDarkMode ? 'bg-gray-700' : 'bg-sky-200/60'}>
                      <td className={`px-3 py-2 font-semibold border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} text-white`}>Total</td>
                      <td className={`px-3 py-2 font-semibold text-right border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} text-white`}>
                        {ledgerDerived.totals.weight.toFixed(3)}
                      </td>
                      <td className={`px-3 py-2 font-semibold text-right border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} text-white`}>
                        {ledgerDerived.totals.balanceWeight.toFixed(3)}
                      </td>
                      <td className={`px-3 py-2 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`} />
                      <td className={`px-3 py-2 font-semibold text-right border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} text-white`}>
                        {ledgerDerived.totals.fineWeight.toFixed(3)}
                      </td>
                      <td className={`px-3 py-2 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`} />
                      <td className={`px-3 py-2 border-r ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`} />
                      <td className="px-3 py-2" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
