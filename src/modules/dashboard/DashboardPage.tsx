import { useUIStore } from '../../stores/ui.store'
import Navbar from '../../layout/Navbar'
import Sidebar from '../../layout/Sidebar'

export default function DashboardIndex() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2b2d31]' : 'bg-white'}`}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Operations Dashboard
          </h1>
          <p className={`mb-8 ${isDarkMode ? 'text-[#b5bac1]' : 'text-gray-600'}`}>
            Real-time manufacturing performance and control
          </p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Daily Production', value: '19,847', info: 'Units manufactured' },
              { title: 'Efficiency Rating', value: '93.2%', info: 'Target: 90%' },
              { title: 'Equipment Uptime', value: '96.8%', info: 'Operational status' },
              { title: 'Open Orders', value: '73', info: 'In production queue' },
            ].map((kpi) => (
              <div
                key={kpi.title}
                className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1e1f22] border border-[#3e4047]' : 'bg-white border border-gray-200'}`}
              >
                <div className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-[#b5bac1]' : 'text-gray-600'}`}>
                  {kpi.title}
                </div>
                <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {kpi.value}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-[#80848e]' : 'text-gray-500'}`}>
                  {kpi.info}
                </div>
              </div>
            ))}
          </div>

          {/* Production Lines */}
          <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-[#1e1f22] border border-[#3e4047]' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Production Line Status
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Main Assembly Line', status: 'Running', color: 'green' },
                { name: 'Secondary Assembly', status: 'Running', color: 'green' },
                { name: 'Quality Control Station', status: 'Setup', color: 'yellow' },
                { name: 'Packaging Line', status: 'Running', color: 'green' },
              ].map((line) => (
                <div key={line.name} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                  <span className={isDarkMode ? 'text-[#b5bac1]' : 'text-gray-700'}>{line.name}</span>
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      line.color === 'green'
                        ? 'bg-green-500 text-white'
                        : line.color === 'yellow'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {line.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}