import { useUIStore } from '../../stores/ui.store';

export default function DashboardIndex() {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  return (
    <div>
      <h1
        className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      >
        Operations Dashboard
      </h1>
      <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Real-time manufacturing performance and control
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { title: 'Daily Production', value: '19,847', info: 'Units manufactured', color: 'blue' },
          { title: 'Efficiency Rating', value: '93.2%', info: 'Target: 90%', color: 'green' },
          {
            title: 'Equipment Uptime',
            value: '96.8%',
            info: 'Operational status',
            color: 'purple',
          },
          { title: 'Open Orders', value: '73', info: 'In production queue', color: 'amber' },
        ].map((kpi) => (
          <div
            key={kpi.title}
            className={`p-5 sm:p-6 rounded-xl ${
              isDarkMode
                ? 'bg-gray-800/50 border border-gray-700'
                : 'bg-white border border-gray-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {kpi.title}
              </div>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  kpi.color === 'blue'
                    ? isDarkMode
                      ? 'bg-blue-500/20'
                      : 'bg-blue-100'
                    : kpi.color === 'green'
                      ? isDarkMode
                        ? 'bg-green-500/20'
                        : 'bg-green-100'
                      : kpi.color === 'purple'
                        ? isDarkMode
                          ? 'bg-purple-500/20'
                          : 'bg-purple-100'
                        : isDarkMode
                          ? 'bg-amber-500/20'
                          : 'bg-amber-100'
                }`}
              >
                <svg
                  className={`w-4 h-4 ${
                    kpi.color === 'blue'
                      ? isDarkMode
                        ? 'text-blue-400'
                        : 'text-blue-600'
                      : kpi.color === 'green'
                        ? isDarkMode
                          ? 'text-green-400'
                          : 'text-green-600'
                        : kpi.color === 'purple'
                          ? isDarkMode
                            ? 'text-purple-400'
                            : 'text-purple-600'
                          : isDarkMode
                            ? 'text-amber-400'
                            : 'text-amber-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {kpi.value}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {kpi.info}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Production Lines - Takes 2 columns */}
        <div
          className={`lg:col-span-2 p-5 sm:p-6 rounded-xl ${
            isDarkMode
              ? 'bg-gray-800/50 border border-gray-700'
              : 'bg-white border border-gray-200 shadow-sm'
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Production Line Status
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Main Assembly Line', status: 'Running', progress: 87, color: 'green' },
              { name: 'Secondary Assembly', status: 'Running', progress: 72, color: 'green' },
              { name: 'Quality Control Station', status: 'Setup', progress: 45, color: 'yellow' },
              { name: 'Packaging Line', status: 'Running', progress: 91, color: 'green' },
            ].map((line) => (
              <div
                key={line.name}
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {line.name}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      line.color === 'green'
                        ? isDarkMode
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-100 text-green-700'
                        : line.color === 'yellow'
                          ? isDarkMode
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-yellow-100 text-yellow-700'
                          : isDarkMode
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {line.status}
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <div
                    className={`h-2 rounded-full transition-all ${
                      line.color === 'green'
                        ? 'bg-green-500'
                        : line.color === 'yellow'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${line.progress}%` }}
                  ></div>
                </div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {line.progress}% complete
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className={`p-5 sm:p-6 rounded-xl ${
            isDarkMode
              ? 'bg-gray-800/50 border border-gray-700'
              : 'bg-white border border-gray-200 shadow-sm'
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: 'Order #1234 completed', time: '2 min ago', icon: 'check' },
              { action: 'New shipment received', time: '15 min ago', icon: 'truck' },
              { action: 'Quality check passed', time: '1 hr ago', icon: 'shield' },
              { action: 'Maintenance scheduled', time: '2 hrs ago', icon: 'wrench' },
              { action: 'Inventory updated', time: '3 hrs ago', icon: 'box' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    {activity.action}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
