import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { NOT_FOUND_PATH } from '../config/navigation.config';
import Breadcrumbs from '../layout/Breadcrumbs';

/** Location state when redirecting to 404 (e.g. resource deleted, invalid ID) */
export interface NotFoundLocationState {
  reason?: string;
}

export { NOT_FOUND_PATH };

export default function PageNotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const state = location.state as NotFoundLocationState | null;
  const reasonHint =
    state?.reason ??
    'The page may have been moved, removed, or the URL might be incorrect.';

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Page not found' },
        ]}
        className="mb-4"
      />
      <div
        className={`flex-1 flex flex-col items-center justify-center rounded-xl border p-6 sm:p-8 ${
          isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white shadow-sm'
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className={`mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <svg
              className="w-20 h-20 sm:w-24 sm:h-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1
            className={`text-2xl sm:text-3xl font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            This page doesn&apos;t exist
          </h1>

          <p className={`mb-2 text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {reasonHint}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-gold-600 hover:bg-gold-700 text-black'
                  : 'bg-amber-500 hover:bg-amber-600 text-black'
              }`}
            >
              Go Home
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm border transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
