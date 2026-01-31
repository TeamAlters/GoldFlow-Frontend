import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './auth.store'

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * Wraps content that requires authentication.
 * Redirects to /loginUp if the user is not logged in, preserving the intended URL in state for redirect after login.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/loginUp" state={{ from: location }} replace />
  }

  return <>{children}</>
}
