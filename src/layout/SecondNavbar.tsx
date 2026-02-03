qimport { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'
import { navbarMenuItems } from '../config/navigation.config'

/** Safely evaluate a simple "a op b" expression (add, subtract, multiply, divide). Returns null if invalid. */
function evaluateCalculatorInput(input: string): number | null {
  const trimmed = input.replace(/\s/g, '')
  const match = trimmed.match(/^(-?[\d.]+)\s*([+\-*/])\s*(-?[\d.]+)$/)
  if (!match) return null
  const [, aStr, op, bStr] = match
  const a = parseFloat(aStr)
  const b = parseFloat(bStr)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b === 0 ? null : a / b
    default: return null
  }
}

function formatResult(n: number): string {
  if (Number.isInteger(n)) return String(n)
  const s = n.toFixed(6).replace(/\.?0+$/, '')
  return s.length > 12 ? n.toExponential(4) : s
}

interface SecondNavbarProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export default function SecondNavbar({ onToggleSidebar, isSidebarOpen }: SecondNavbarProps) {
  const location = useLocation()
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const [calculatorInput, setCalculatorInput] = useState('')
  const liveResult = calculatorInput.trim() ? evaluateCalculatorInput(calculatorInput) : null

  // Don't show navbar on login/signup pages
  if (location.pathname === '/loginUp' || location.pathname === '/signUp') {
    return null
  }

  const inputBaseClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-amber-400 focus:ring-amber-400/25'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 shadow-sm hover:border-gray-300 focus:border-amber-500 focus:ring-amber-500/20'

  return (
    <nav className={`fixed top-16 left-0 right-0 z-40 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    } border-b`}>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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

          {/* Right - Calculator: one input-style block with expression + result */}
          <div
            className={`group flex items-center h-8 w-full max-w-[200px] sm:max-w-[240px] rounded-lg border transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-0 ${inputBaseClass} ${
              isDarkMode ? 'focus-within:border-amber-400 focus-within:ring-amber-400/25' : 'focus-within:border-amber-500 focus-within:ring-amber-500/20'
            }`}
          >
            <div className="pl-3 flex items-center shrink-0 pointer-events-none">
              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400 group-focus-within:text-amber-400' : 'text-gray-500 group-focus-within:text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={calculatorInput}
              onChange={(e) => setCalculatorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && liveResult !== null) {
                  e.preventDefault()
                  setCalculatorInput(formatResult(liveResult))
                }
              }}
              placeholder="e.g. 2+3"
              title="Calculator: result updates as you type. Enter copies result."
              className={`h-full flex-1 min-w-0 pl-2 pr-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 ${
                isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
            {calculatorInput.trim() && (
              <>
                <div className={`shrink-0 w-px h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} aria-hidden />
                <div
                  className={`shrink-0 pr-3 pl-2 text-sm font-medium tabular-nums ${
                    liveResult !== null
                      ? isDarkMode
                        ? 'text-amber-400'
                        : 'text-amber-600'
                      : isDarkMode
                      ? 'text-red-400/80'
                      : 'text-red-500/80'
                  }`}
                  title={liveResult !== null ? 'Result' : 'Invalid'}
                >
                  {liveResult !== null ? formatResult(liveResult) : '—'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Items */}
      <div className={`md:hidden border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-2`}>
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
  )
}
