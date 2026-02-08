import { useUIStore } from '../../stores/ui.store';

export interface PaginationProps {
  /** Current 1-based page (from API pagination.page) */
  page: number;
  /** Items per page (from API pagination.page_size) */
  pageSize: number;
  /** Total item count (from API pagination.total_items) */
  totalItems: number;
  /** Total pages (from API pagination.total_pages) */
  totalPages: number;
  /** Called when user requests another page; parent should set page and refetch */
  onPageChange: (nextPage: number) => void;
  /** When true, buttons are disabled (e.g. while loading) */
  loading?: boolean;
  /** Optional extra class for the wrapper */
  className?: string;
}

/**
 * Server-side pagination UI driven by API response shape:
 * { page, page_size, total_items, total_pages }.
 * No API calls; parent owns state and fetch.
 */
export default function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  loading = false,
  className = '',
}: PaginationProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  const showPagination = totalPages >= 1;
  if (!showPagination) return null;

  const prevDisabled = page <= 1 || loading;
  const nextDisabled = page >= totalPages || loading;

  const textClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const btnBase =
    'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1';
  const btnDisabled = isDarkMode
    ? 'text-gray-500 border-gray-600/30 bg-gray-800/30 cursor-not-allowed opacity-70'
    : 'text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed opacity-70';
  const btnEnabled = isDarkMode
    ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border-blue-500/30 hover:border-blue-500/50 focus-visible:ring-blue-500/50'
    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200 hover:border-blue-300 focus-visible:ring-blue-400';
  const prevBtnClass = prevDisabled ? btnDisabled : btnEnabled;
  const nextBtnClass = nextDisabled ? btnDisabled : btnEnabled;

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 py-2 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <div className={`text-sm ${textClass}`}>
        Showing {start} to {end} of {totalItems} results
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={prevDisabled}
          aria-label="Previous page"
          className={`${btnBase} ${prevBtnClass}`}
        >
          Previous
        </button>
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={nextDisabled}
          aria-label="Next page"
          className={`${btnBase} ${nextBtnClass}`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
