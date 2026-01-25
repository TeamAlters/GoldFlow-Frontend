import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'

export default function Navbar() {
  const location = useLocation()
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const toggleTheme = useUIStore((state) => state.toggleTheme)

  // Don't show navbar on login/signup pages
  if (location.pathname === '/loginUp' || location.pathname === '/signUp') {
    return null
  }

  return (
    <nav className={`${isDarkMode ? 'bg-[#1e1f22]' : 'bg-white'} border-b ${isDarkMode ? 'border-[#3e4047]' : 'border-gray-200'} px-4 sm:px-8 py-4 shadow-sm`}>
      <div className="flex justify-between items-center">
        <div className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          GoldFlow
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/index"
            className={`text-sm sm:text-base transition-colors ${
              location.pathname === '/index'
                ? isDarkMode
                  ? 'text-white font-semibold'
                  : 'text-gray-900 font-semibold'
                : isDarkMode
                ? 'text-[#b5bac1] hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </Link>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDarkMode
                ? 'bg-[#5865f2] focus:ring-[#5865f2]'
                : 'bg-gray-300 focus:ring-gray-400'
            }`}
            aria-label="Toggle theme"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                isDarkMode ? 'translate-x-7' : 'translate-x-0'
              }`}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {isDarkMode ? (
                  <svg className="w-4 h-4 text-[#5865f2]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}