import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import SecondNavbar from './SecondNavbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../stores/ui.store'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  // Don't show layout on login/signup pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signUp'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {/* Main Navbar - Logo, User, Theme */}
      <Navbar />

      {/* Second Navbar - Toggle, Menu, Search */}
      <SecondNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content - smooth shift when sidebar opens/closes */}
      <main
        className={`pt-28 md:pt-28 transition-[margin] duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
