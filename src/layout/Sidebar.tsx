import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'

export default function Sidebar() {
  const location = useLocation()
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  const navItems = [
    {
      category: 'Production',
      items: [
        { name: 'Dashboard', path: '/index' },
        { name: 'Work Orders', path: '/work-orders' },
        { name: 'Scheduling', path: '/scheduling' },
        { name: 'Resources', path: '/resources' },
      ],
    },
    {
      category: 'Inventory',
      items: [
        { name: 'Materials', path: '/materials' },
        { name: 'Stock Levels', path: '/stock-levels' },
        { name: 'Suppliers', path: '/suppliers' },
      ],
    },
    {
      category: 'Quality',
      items: [
        { name: 'Inspections', path: '/inspections' },
        { name: 'Metrics', path: '/metrics' },
        { name: 'Compliance', path: '/compliance' },
      ],
    },
  ]

  return (
    <aside className={`w-64 ${isDarkMode ? 'bg-[#313338]' : 'bg-gray-50'} min-h-screen p-4`}>
      {navItems.map((group) => (
        <div key={group.category} className="mb-6">
          <div className={`text-xs font-bold uppercase mb-2 px-4 ${isDarkMode ? 'text-[#80848e]' : 'text-gray-500'}`}>
            {group.category}
          </div>
          {group.items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded mb-1 ${
                location.pathname === item.path
                  ? isDarkMode
                    ? 'bg-[#404249] text-white border-l-4 border-[#5865f2]'
                    : 'bg-gray-900 text-white'
                  : isDarkMode
                  ? 'text-[#b5bac1] hover:bg-[#2b2d31] hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  )
}