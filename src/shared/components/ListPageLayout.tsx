import { useUIStore } from '../../stores/ui.store';

export interface ListPageLayoutProps {
  /** Page title (e.g. "User Management") */
  title: string;
  /** Optional subtitle below the title */
  description?: string;
  /** Left side of toolbar (e.g. "Total Users: 42") */
  toolbarLeft?: React.ReactNode;
  /** Right side of toolbar (e.g. Add button) */
  toolbarRight?: React.ReactNode;
  /** Optional filters row (e.g. FilterComponent) */
  filters?: React.ReactNode;
  /** Main content: DataTable, pagination, etc. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable layout for list pages: header, toolbar (total + primary action), filters, and content.
 * Use for Users, Roles, and any other page with the same structure (DataTable + filters + add btn + total count).
 */
export default function ListPageLayout({
  title,
  description,
  toolbarLeft,
  toolbarRight,
  filters,
  children,
  className = '',
}: ListPageLayoutProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  return (
    <div className={`w-full ${className}`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {title}
        </h1>
        {description != null && description !== '' && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </p>
        )}
      </div>

      {/* Toolbar - Total / summary on left, primary action on right */}
      {(toolbarLeft != null || toolbarRight != null) && (
        <div
          className={`mb-4 rounded-xl border p-4 ${
            isDarkMode
              ? 'bg-gray-800/70 border-gray-700'
              : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              {toolbarLeft}
            </div>
            {toolbarRight && <div className="w-full sm:w-auto">{toolbarRight}</div>}
          </div>
        </div>
      )}

      {/* Filters */}
      {filters != null && <div className="mb-4">{filters}</div>}

      {/* Main content: pagination + DataTable or custom content */}
      {children}
    </div>
  );
}
