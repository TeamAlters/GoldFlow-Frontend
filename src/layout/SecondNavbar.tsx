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

  return (
    <nav className={`fixed top-16 left-0 right-0 z-40 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    } border-b`}>
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-10">
          {/* Right - Sidebar Toggle */}
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
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
            {navbarMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          
          {/* Left - Calculator Input */}
          <div className="flex items-center flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Calculator"
                className={`w-50 sm:w-48 pl-9 pr-4 py-1.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
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
