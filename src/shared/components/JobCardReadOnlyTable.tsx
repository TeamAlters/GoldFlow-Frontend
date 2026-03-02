import { Link } from 'react-router-dom';

export type JobCardReadOnlyColumn = {
  key: string;
  header: string;
  type?: 'text' | 'tag' | 'link' | 'date';
};

export interface JobCardReadOnlyTableProps {
  columns: JobCardReadOnlyColumn[];
  rows: Record<string, unknown>[];
  getLinkHref?: (row: Record<string, unknown>, key: string) => string | null;
  tagClass?: string;
  formatDate?: (val: unknown) => string;
  isDarkMode: boolean;
  rowKey?: (row: Record<string, unknown>, index: number) => string;
  renderActions?: (row: Record<string, unknown>) => React.ReactNode;
}

export default function JobCardReadOnlyTable({
  columns,
  rows,
  getLinkHref,
  tagClass = '',
  formatDate = () => '–',
  isDarkMode,
  rowKey = (_, i) => String(i),
  renderActions,
}: JobCardReadOnlyTableProps) {
  const containerClass = `overflow-x-auto rounded-lg border w-full ${
    isDarkMode ? 'border-gray-600' : 'border-gray-200'
  }`;
  const thClass = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-[#F2EFE9] text-gray-800 border-gray-200'
  }`;
  const tdClass = `px-4 py-3 text-sm ${
    isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-900 border-gray-200'
  }`;
  const refLinkClass = isDarkMode
    ? 'text-amber-400 hover:text-amber-300'
    : 'text-[#B87820] hover:text-[#C8861E] underline';

  const renderCell = (row: Record<string, unknown>, col: JobCardReadOnlyColumn) => {
    const val = row[col.key];
    const str = val != null && val !== '' ? String(val) : null;
    const type = col.type ?? 'text';

    if (type === 'link' && getLinkHref) {
      const href = getLinkHref(row, col.key);
      if (href && str) {
        return (
          <Link to={href} className={refLinkClass}>
            {str}
          </Link>
        );
      }
      return str ?? '–';
    }

    if (type === 'tag') {
      if (str) {
        const href = getLinkHref ? getLinkHref(row, col.key) : null;
        if (href) {
          return (
            <Link to={href} className={tagClass || (isDarkMode ? 'text-gray-200' : 'text-gray-900')}>
              {str}
            </Link>
          );
        }
        return <span className={tagClass || (isDarkMode ? 'text-gray-200' : 'text-gray-900')}>{str}</span>;
      }
      return '–';
    }

    if (type === 'date') {
      return formatDate(val);
    }

    return str ?? '–';
  };

  return (
    <div className={containerClass}>
      <table className="w-full">
        <thead>
          <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
            {columns.map((col, i) => (
              <th
                key={col.key}
                className={i < columns.length - 1 ? `${thClass} border-r` : thClass}
              >
                {col.header}
              </th>
            ))}
            {renderActions && <th className={`${thClass} w-20`}>Actions</th>}
          </tr>
        </thead>
        <tbody className={isDarkMode ? 'divide-y divide-gray-600' : 'divide-y divide-gray-200'}>
          {rows.map((row, rowIndex) => (
            <tr key={rowKey(row, rowIndex)} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={i < columns.length - 1 ? `${tdClass} border-r` : tdClass}
                >
                  {renderCell(row, col)}
                </td>
              ))}
              {renderActions && (
                <td className={tdClass}>
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
