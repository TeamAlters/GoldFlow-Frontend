import { useUIStore } from '../../stores/ui.store';

export type ErrorType = '404' | 'image' | 'data' | 'network' | 'unauthorized' | 'empty';

export interface PageErrorProps {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export default function PageError({
  type,
  message,
  onRetry,
  onGoBack,
  onGoHome,
}: PageErrorProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const getErrorConfig = () => {
    switch (type) {
      case '404':
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Page Not Found',
          description: message || "The page you're looking for doesn't exist or has been moved.",
        };
      case 'image':
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          title: 'Image Not Found',
          description: message || 'The image could not be loaded. It may have been moved or deleted.',
        };
      case 'data':
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Unable to Load Data',
          description: message || 'There was a problem loading the data. Please try again.',
        };
      case 'network':
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          ),
          title: 'Network Error',
          description: message || 'Please check your internet connection and try again.',
        };
      case 'unauthorized':
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          title: 'Access Denied',
          description: message || "You don't have permission to view this content.",
        };
      case 'empty':
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          ),
          title: 'No Data Found',
          description: message || "There's no data available to display.",
        };
      default:
        return {
          icon: (
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          title: 'Something Went Wrong',
          description: message || 'An unexpected error occurred. Please try again.',
        };
    }
  };

  const config = getErrorConfig();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div
        className={`text-center max-w-md ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        <div className="flex justify-center mb-6">
          <div className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
            {config.icon}
          </div>
        </div>

        <h2
          className={`text-2xl font-bold mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {config.title}
        </h2>

        <p className="mb-8 text-base">{config.description}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Try Again
            </button>
          )}

          {onGoBack && (
            <button
              onClick={handleGoBack}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Go Back
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
