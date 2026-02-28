/**
 * Returns the Tailwind CSS classes for section styling in entity view pages.
 * @param isDarkMode - Whether dark mode is enabled
 * @returns The appropriate CSS class string
 */
export const getSectionClass = (isDarkMode: boolean): string =>
  `border rounded-lg p-4 mb-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;
