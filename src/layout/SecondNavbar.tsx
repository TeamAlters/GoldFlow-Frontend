import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { navbarMenuItems } from '../config/navigation.config';

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
      className={`fixed top-16 left-0 right-0 z-40 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } border-b`}
    >
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 h-11">
          {/* Left - Sidebar Toggle */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Center - Menu Items */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navbarMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right - Calculator: input with result dropdown below */}
          <div className="hidden md:flex items-center">
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
                  className={`absolute top-full left-0 mt-1 px-2 py-1 text-xs rounded shadow-lg z-20 tabular-nums ${
                    isDarkMode ? 'bg-gray-800 text-amber-400' : 'bg-gray-800 text-white'
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
          {navbarMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                location.pathname === item.path
                  ? isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
