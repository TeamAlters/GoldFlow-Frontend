import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'
import { navbarMenuItems } from '../config/navigation.config'

interface SecondNavbarProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export default function SecondNavbar({ onToggleSidebar, isSidebarOpen }: SecondNavbarProps) {
  const location = useLocation()
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const [searchQuery, setSearchQuery] = useState('')

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

          {/* Right - Calculator (matches menu-item height and style) */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <div className="relative group w-full max-w-[180px] sm:max-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-4 h-4 shrink-0 transition-colors ${isDarkMode ? 'text-gray-400 group-focus-within:text-amber-400' : 'text-gray-500 group-focus-within:text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Calculator"
                className={`w-full h-8 pl-9 pr-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${inputBaseClass}`}
              />
            </div>
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
