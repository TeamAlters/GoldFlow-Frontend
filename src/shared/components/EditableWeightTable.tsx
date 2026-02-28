import { useUIStore } from '../../stores/ui.store';

export type ColumnDef<T> = {
  key: string;
  header: string;
  width?: string;
  isEditable?: boolean;
  isReadOnly?: boolean;
  isDropdown?: boolean;
  dropdownOptions?: Array<{ value: string; label: string }>;
  renderCell?: (row: T, index: number) => React.ReactNode;
};

export interface EditableWeightTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  readOnly?: boolean;
  showAddButton?: boolean;
  showTotals?: boolean;
  showActions?: boolean;
  onAddRow?: () => void;
  onDeleteRow?: (index: number) => void;
  onClearRow?: (index: number) => void;
  getRowId?: (row: T, index: number) => string | number;
  onCellChange?: (index: number, key: string, value: string) => void;
}

export default function EditableWeightTable<T extends Record<string, unknown>>({
  columns,
  data,
  onDataChange,
  readOnly = false,
  showAddButton = true,
  showTotals = true,
  showActions = true,
  onAddRow,
  onDeleteRow,
  onClearRow,
  getRowId,
  onCellChange,
}: EditableWeightTableProps<T>) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  
  // Determine if actions should be shown
  const showActionButtons = showActions && (onDeleteRow || onClearRow);

  // Handler type for cell changes - accepts string key for flexibility
  const handleCellChange = (index: number, key: string, value: string) => {
    if (onCellChange) {
      onCellChange(index, key, value);
    } else if (onDataChange) {
      const newData = [...data];
      newData[index] = { ...newData[index], [key]: value };
      onDataChange(newData);
    }
  };

  const inputClass = readOnly
    ? `w-full px-2 py-1.5 text-sm rounded border ${
        isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-700'
      }`
    : `w-full px-2 py-1.5 text-sm rounded border transition-all focus:outline-none focus:ring-2 ${
        isDarkMode
          ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20'
          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
      }`;

  const thClass = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r ${
    isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-500' : 'bg-teal-700 text-white border-teal-600'
  }`;

  const tdClass = `px-4 py-3 text-sm border-r ${
    isDarkMode ? 'border-gray-500' : 'border-gray-300'
  }`;

  const handleInputChange = (index: number, key: string, value: string) => {
    if (onCellChange) {
      onCellChange(index, key, value);
    } else if (onDataChange) {
      const newData = [...data];
      newData[index] = { ...newData[index], [key]: value };
      onDataChange(newData);
    }
  };

  // Calculate totals for numeric columns
  const totals = columns.reduce<Record<string, number>>((acc, col) => {
    if (col.isReadOnly && !col.isEditable) {
      const sum = data.reduce((total, row) => {
        const val = Number(row[col.key]) || 0;
        return total + val;
      }, 0);
      acc[col.key] = sum;
    }
    return acc;
  }, {});

  return (
    <div className={`overflow-x-auto rounded-lg border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className={`${thClass} w-12`}>Sr.no</th>
            {columns.map((col) => (
              <th key={col.key} className={`${thClass} ${col.width || ''}`}>
                {col.header}
              </th>
            ))}
            {showActionButtons && (
              <th className={`${thClass} w-24`}>Action</th>
            )}
          </tr>
        </thead>
        <tbody className={isDarkMode ? 'divide-y divide-gray-600 bg-gray-800' : 'divide-y divide-gray-200 bg-white'}>
          {data.map((row, index) => (
            <tr key={getRowId ? getRowId(row, index) : index}>
              <td className={`${tdClass} text-center font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {index + 1}
              </td>
              {columns.map((col) => (
                <td key={col.key} className={tdClass}>
                  {col.renderCell ? (
                    col.renderCell(row, index)
                  ) : col.isDropdown && col.dropdownOptions ? (
                    <select
                      value={String(row[col.key] || '')}
                      onChange={(e) => handleInputChange(index, col.key, e.target.value)}
                      disabled={readOnly}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {col.dropdownOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : col.isEditable ? (
                    <input
                      type="text"
                      value={String(row[col.key] || '')}
                      onChange={(e) => handleInputChange(index, col.key, e.target.value)}
                      disabled={readOnly}
                      className={inputClass}
                    />
                  ) : col.isReadOnly ? (
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                      {row[col.key] !== undefined && row[col.key] !== null
                        ? String(row[col.key])
                        : '–'}
                    </span>
                  ) : (
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                      {String(row[col.key] || '')}
                    </span>
                  )}
                </td>
              ))}
              {showActionButtons && (
                <td className={`${tdClass} text-center`}>
                  <div className="flex items-center justify-center gap-1">
                    {onClearRow && (
                      <button
                        type="button"
                        onClick={() => onClearRow(index)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-orange-400 hover:bg-orange-500/20'
                            : 'text-orange-600 hover:bg-orange-50'
                        }`}
                        title="Clear row values"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    {onDeleteRow && (
                      <button
                        type="button"
                        onClick={() => onDeleteRow(index)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-red-400 hover:bg-red-500/20'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title="Delete row"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 2}
                className={`${tdClass} text-center py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
        {showTotals && Object.keys(totals).length > 0 && data.length > 0 && (
          <tfoot className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
            <tr>
              <td className={`${tdClass} text-center font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Total
              </td>
              {columns.map((col) => (
                <td key={col.key} className={`${tdClass} font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {totals[col.key] !== undefined
                    ? totals[col.key].toFixed(4)
                    : ''}
                </td>
              ))}
              {showActionButtons && <td className={tdClass}></td>}
            </tr>
          </tfoot>
        )}
      </table>
      {!readOnly && showAddButton && onAddRow && (
        <div className="p-3 flex justify-end">
          <button
            type="button"
            onClick={onAddRow}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            + Add Row
          </button>
        </div>
      )}
    </div>
  );
}
