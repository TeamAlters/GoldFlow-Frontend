import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'
import { useAuthStore } from '../auth/auth.store'
import { logout as logoutApi } from '../auth/auth.api'
import { toast } from '../stores/toast.store'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsUserDropdownOpen(false)
    if (token) {
      try {
        await logoutApi(token)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Logout failed'
        toast.error(msg)
      }
    }
    logout()
    navigate('/login', { replace: true })
  }

  const handleUserInfo = () => {
    setIsUserDropdownOpen(false)
    navigate('/profile')
  }
  

  // Don't show navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signUp') {
    return null
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    } border-b shadow-sm`}>
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
         
          <div className="flex items-center gap-4">
           

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-600' 
                  : 'bg-gradient-to-br from-amber-400 to-yellow-500'
              } shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className={`text-xl font-bold tracking-tight hidden sm:block ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent'
              }`}>
                GoldFlow
              </span>
            </Link>
          </div>

          {/* Right Section - Search, Theme Toggle & User */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden sm:block mr-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`w-48 lg:w-64 pl-9 pr-4 py-1.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

      

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                aria-label="User menu"
              >
                {/* User Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-50 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  {/* User Info Section */}
                  <button
                    onClick={handleUserInfo}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 border-b border-gray-700' 
                        : 'hover:bg-gray-50 border-b border-gray-100'
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user?.name ?? user?.username ?? 'User'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user?.email ?? '—'}
                      </p>
                    </div>
                    {/* Arrow Icon */}
                    <svg className={`w-4 h-4 ml-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-500/10' 
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {/* Logout Icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    
    </nav>
  )
}
