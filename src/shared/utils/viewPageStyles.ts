/**
 * Returns the Tailwind CSS classes for section styling in entity view pages.
 * @param isDarkMode - Whether dark mode is enabled
 * @returns The appropriate CSS class string
 */
export const getSectionClass = (isDarkMode: boolean): string =>
  `border rounded-lg p-4 mb-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

/** Dot colors for section headers (use with rounded-full). */
export const SECTION_DOT = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  black: 'bg-gray-800 dark:bg-gray-600',
} as const;

export const getSectionHeaderClass = (isDarkMode: boolean): string =>
  `text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
  }`;

export const TAG_VARIANT_CLASSES: Record<string, string> = {
  product: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  melting_lot: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  purity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  department: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  department_group: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  design: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

export function getTagClass(variant: string): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium';
  return `${base} ${TAG_VARIANT_CLASSES[variant] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`;
}