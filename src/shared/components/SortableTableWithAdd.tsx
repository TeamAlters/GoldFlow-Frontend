import { useState } from 'react';
import { useUIStore } from '../../stores/ui.store';
import { FormSelect } from './FormSelect';
import type { FormSelectOption } from './FormSelect';

export type SortableTableRow = {
  id: string;
  order: number;
  department_id: string;
  is_active: boolean;
};

export interface SortableTableWithAddProps {
  /** Rows to display */
  rows: SortableTableRow[];
  /** Called when rows change (add, remove, reorder, edit) */
  onChange: (rows: SortableTableRow[]) => void;
  /** Options for department dropdown */
  departmentOptions: FormSelectOption[];
  /** Label for add button (e.g. "+Add Department") */
  addButtonLabel: string;
  /** When true, all inputs are disabled (view mode) */
  readOnly?: boolean;
  /** Optional title above the table */
  title?: string;
}

let rowIdCounter = 0;

function generateRowId(): string {
  rowIdCounter += 1;
  return `row-${Date.now()}-${rowIdCounter}`;
}

export default function SortableTableWithAdd({
  rows,
  onChange,
  departmentOptions,
  addButtonLabel,
  readOnly = false,
  title = 'Department',
}: SortableTableWithAddProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDraggedIndex(null);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(fromIndex) || fromIndex === dropIndex) return;
    const next = [...rows];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(dropIndex, 0, removed);
    const reordered = next.map((r, i) => ({ ...r, order: i + 1 }));
    onChange(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddRow = () => {
    const maxOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.order), 0) : 0;
    const newRow: SortableTableRow = {
      id: generateRowId(),
      order: maxOrder + 1,
      department_id: '',
      is_active: true,
    };
    onChange([...rows, newRow]);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...rows];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    const reordered = next.map((r, i) => ({ ...r, order: i + 1 }));
    onChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index >= rows.length - 1) return;
    const next = [...rows];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    const reordered = next.map((r, i) => ({ ...r, order: i + 1 }));
    onChange(reordered);
  };

  const handleRemoveRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    const reordered = next.map((r, i) => ({ ...r, order: i + 1 }));
    onChange(reordered);
  };

  const handleRowChange = (index: number, field: keyof SortableTableRow, value: string | boolean) => {
    const next = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    onChange(next);
  };

  const inputClass = `w-full max-w-[200px] px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
    isDarkMode
      ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  const readOnlyCellClass = `min-h-[40px] px-3 py-2.5 flex items-center rounded-lg border text-sm ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  const thClass = `px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${
    isDarkMode
      ? 'text-gray-200 bg-gray-700 border-b border-gray-600'
      : 'text-gray-700 bg-gray-100 border-b border-gray-200'
  }`;
  const tdClass = `px-5 py-3.5 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`;

  return (
    <div className="w-full">
      {title && (
        <h3 className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      )}
      <div
        className={`overflow-visible rounded-xl border shadow-sm ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <table className="min-w-full">
          <thead>
            <tr>
              {!readOnly && <th className={`${thClass} w-10`} aria-label="Drag to reorder" />}
              <th className={`${thClass} w-24`}>Order (Sr.No)</th>
              <th className={`${thClass} w-48`}>Department</th>
              <th className={`${thClass} w-28 text-right`}>Is Active</th>
              {!readOnly && <th className={`${thClass} w-32 text-right`}>Actions</th>}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                draggable={!readOnly}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 ${
                  draggedIndex === index
                    ? isDarkMode
                      ? 'opacity-90 ring-2 ring-blue-400/70 bg-gray-700/90'
                      : 'opacity-90 ring-2 ring-blue-500/60 bg-blue-50/80'
                    : isDarkMode
                      ? index % 2 === 0
                        ? 'bg-gray-800/50'
                        : 'bg-gray-800/30'
                      : index % 2 === 0
                        ? 'bg-white'
                        : 'bg-gray-50/50'
                }`}
              >
                {!readOnly && (
                  <td className={`${tdClass} w-10 align-middle`}>
                    <div
                      className={`inline-flex cursor-grab active:cursor-grabbing touch-none p-1 rounded select-none ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      title="Drag to reorder"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
                      </svg>
                    </div>
                  </td>
                )}
                <td className={`${tdClass} font-medium`}>{index + 1}</td>
                <td className={`${tdClass} overflow-visible`}>
                  {readOnly ? (
                    <div className={readOnlyCellClass}>
                      {departmentOptions.find((o) => o.value === row.department_id)?.label ?? (row.department_id ? row.department_id : '–')}
                    </div>
                  ) : (
                    <div className="max-w-[200px] min-w-0 overflow-visible">
                      <FormSelect
                        value={row.department_id}
                        onChange={(v) => handleRowChange(index, 'department_id', v)}
                        options={departmentOptions}
                        placeholder="Select department"
                        className={inputClass}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}
                </td>
                <td className={`${tdClass} text-right`}>
                  {readOnly ? (
                    <div className="flex justify-end">
                      <div className={`${readOnlyCellClass} w-fit min-w-[72px] justify-center`}>
                        {row.is_active ? 'Yes' : 'No'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => handleRowChange(index, 'is_active', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                        aria-label="Is active"
                      />
                    </div>
                  )}
                </td>
                {!readOnly && (
                  <td className={`${tdClass} text-right`}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                        className={`p-2 rounded-lg transition-colors ${index === 0 ? 'opacity-40 cursor-not-allowed' : ''} ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                        aria-label="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === rows.length - 1}
                        title="Move down"
                        className={`p-2 rounded-lg transition-colors ${index === rows.length - 1 ? 'opacity-40 cursor-not-allowed' : ''} ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                        aria-label="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        title="Remove row"
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-900/50 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={handleAddRow}
          className={`mt-4 px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addButtonLabel}
        </button>
      )}
    </div>
  );
}
