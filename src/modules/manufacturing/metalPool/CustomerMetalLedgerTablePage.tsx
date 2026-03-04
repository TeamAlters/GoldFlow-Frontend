import { useEffect, useState } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { getMetalPoolBalance, type MetalPoolBalanceRow } from './metalPoolBalance.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';

export default function CustomerMetalLedgerTablePage() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  const [rows, setRows] = useState<MetalPoolBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getMetalPoolBalance()
      .then((result) => {
        if (!mounted) return;
        setRows(result.balances);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load metal pool balance';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sectionClass = `border rounded-lg p-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
  }`;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Metal Pool Balance
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          View aggregated metal pool balances by purity.
        </p>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="space-y-6">
  
            <div
              className={`overflow-hidden rounded-lg border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300 bg-white'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-[#F2EFE9] border-gray-200'
                      }`}
                    >
                      {['Purity', 'Balance Weight', 'Total Fine Weight'].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r ${
                            isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-800'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={
                      isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'
                    }
                  >
                    {loading ? (
                      <tr>
                        <td
                          colSpan={3}
                          className={`px-4 py-4 text-center text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          Loading metal pool balance...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className={`px-4 py-4 text-center text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          No metal pool balances found.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => (
                        <tr
                          key={`${row.purity}-${index}`}
                          className={
                            isDarkMode
                              ? index % 2 === 0
                                ? 'bg-gray-800/50'
                                : 'bg-gray-800/30'
                              : 'bg-sky-100/40'
                          }
                        >
                          <td
                            className={`px-6 py-3 text-center whitespace-nowrap border-r ${
                              isDarkMode ? 'border-gray-500 text-white' : 'border-gray-300'
                            }`}
                          >
                            {row.purity}
                          </td>
                          <td
                            className={`px-6 py-3 text-center whitespace-nowrap border-r ${
                              isDarkMode ? 'border-gray-500 text-white' : 'border-gray-300'
                            }`}
                          >
                            {row.balance_weight}
                          </td>
                          <td
                            className={`px-6 py-3 text-center whitespace-nowrap border-r ${
                              isDarkMode ? 'border-gray-500 text-white' : 'border-gray-300'
                            }`}
                          >
                            {row.total_fine_weight}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
         
        </div>
      </div>
    </div>
  );
}
