import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { navbarMenuItems } from '../config/navigation.config';

const NAV_ICONS: Record<string, React.ReactElement> = {
  dashboard: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
    </svg>
  ),
  'file-text': (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  cog: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

/** Safely evaluate mathematical expressions (numbers, + - * / parentheses). Returns result string or empty if invalid. */
function evaluateExpression(expression: string): string {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = new Function('return ' + sanitized)();
    if (typeof result === 'number' && !Number.isNaN(result) && Number.isFinite(result)) {
      return result.toString();
    }
    return '';
  } catch {
    return '';
  }
}

interface SecondNavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function SecondNavbar({ onToggleSidebar, isSidebarOpen }: SecondNavbarProps) {
  const location = useLocation();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [calculatorInput, setCalculatorInput] = useState('');
  const [calculatorResult, setCalculatorResult] = useState('');

  useEffect(() => {
    if (calculatorInput.trim()) {
      const result = evaluateExpression(calculatorInput);
      setCalculatorResult(result);
    } else {
      setCalculatorResult('');
    }
  }, [calculatorInput]);

  // Don't show navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signUp') {
    return null;
  }

  const inputBaseClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-amber-400 focus:ring-amber-400/25'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 shadow-sm hover:border-gray-300 focus:border-amber-500 focus:ring-amber-500/20';

  return (
    <nav
      className={`fixed top-16 left-0 right-0 z-40 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        } border-b`}
    >
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-3 items-center h-11">
          {/* Left - Mobile sidebar toggle only; desktop uses sidebar's own collapse button */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className={`lg:hidden p-2 rounded-lg transition-colors ${isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Center - Menu Items (perfectly centered) */}
          <div className="hidden md:flex items-center justify-center gap-1 h-full">
            {navbarMenuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 h-full text-sm font-medium border-b-2 transition-colors
                    ${active
                      ? isDarkMode
                        ? 'border-amber-400 text-amber-400'
                        : 'border-amber-500 text-amber-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                >
                  {item.icon && NAV_ICONS[item.icon]}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right - Calculator */}
          <div className="hidden md:flex items-center justify-end">
            <div className="relative">
              <input
                type="text"
                value={calculatorInput}
                onChange={(e) => setCalculatorInput(e.target.value)}
                placeholder="Calculator (e.g., 3.45 + 89 / 2)"
                className={`w-64 px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0 ${inputBaseClass} ${isDarkMode ? 'focus:ring-amber-400/25 focus:border-amber-400' : 'focus:ring-amber-500/20 focus:border-amber-500'}`}
              />
              {calculatorResult && (
                <div
                  className={`absolute top-full left-0 mt-1 px-2 py-1 text-xs rounded shadow-lg z-20 tabular-nums ${isDarkMode ? 'bg-gray-800 text-amber-400' : 'bg-gray-800 text-white'
                    }`}
                >
                  = {calculatorResult}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Items */}
      <div
        className={`md:hidden border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-2`}
      >
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {navbarMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${active
                    ? isDarkMode
                      ? 'border-amber-400 text-amber-400'
                      : 'border-amber-500 text-amber-600'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {item.icon && NAV_ICONS[item.icon]}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
