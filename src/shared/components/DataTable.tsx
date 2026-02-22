import { useState, useMemo } from 'react';
import { useUIStore } from '../../stores/ui.store';

export type TableColumn<T> = {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  /** Optional function to return raw sortable value (string/number) for sorting.
   * Use this when accessor returns JSX elements to ensure proper sorting. */
  sortValue?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
};

export type TableAction<T> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
};

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) => {
      return columns.some((column) => {
        const value = column.accessor ? column.accessor(row) : row[column.key];
        return String(value || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const column = columns.find((col) => col.key === sortConfig.key);
      if (!column) return 0;

      // Use sortValue if provided, otherwise fall back to accessor or raw key value
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      if (column.sortValue) {
        aValue = column.sortValue(a);
        bValue = column.sortValue(b);
      } else if (column.accessor) {
        const aRaw = column.accessor(a);
        const bRaw = column.accessor(b);
        // If accessor returns React nodes, try to get text content
        aValue = aRaw != null ? String(aRaw) : null;
        bValue = bRaw != null ? String(bRaw) : null;
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle numeric sorting
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      const aIsNumeric = !isNaN(aNum) && aValue !== '';
      const bIsNumeric = !isNaN(bNum) && bValue !== '';

      if (aIsNumeric && bIsNumeric) {
        const comparison = aNum > bNum ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // String sorting
      const comparison = String(aValue).toLowerCase() > String(bValue).toLowerCase() ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="mb-1">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div
        className={`rounded-lg border-2 border-solid overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-300'
          }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`border-b ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-200'
                  }`}
              >
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'} ${column.sortable
                        ? `cursor-pointer ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                        }`
                        : ''
                      }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div
                      className={`flex items-center gap-2 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}
                    >
                      <span>{column.header}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Loading...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors ${onRowClick
                      ? isDarkMode
                        ? 'hover:bg-gray-700 cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
                      : ''
                      } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                      >
                        {column.accessor ? column.accessor(row) : row[column.key] || '-'}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 active:scale-95 ${action.variant === 'danger'
                                ? isDarkMode
                                  ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 hover:border-red-500/50'
                                  : 'text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 hover:border-red-300'
                                : action.variant === 'secondary'
                                  ? isDarkMode
                                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-600/30 hover:border-gray-500/50'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-700 border border-gray-300 hover:border-gray-400'
                                  : isDarkMode
                                    ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/50'
                                    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-blue-200 hover:border-blue-300'
                                } ${action.className || ''}`}
                            >
                              <div className="flex items-center gap-1.5">
                                {action.icon}
                                <span>{action.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div
            className={`px-4 py-3 border-t flex items-center justify-between ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}
          >
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${currentPage === 1
                  ? isDarkMode
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Previous
              </button>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${currentPage === totalPages
                  ? isDarkMode
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
