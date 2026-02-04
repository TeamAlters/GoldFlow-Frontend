import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearEntityCache } from '../utils/entityCache'

export type AuthUser = {
  id: string
  username?: string
  email: string
  [key: string]: unknown
}

type AuthState = {
  token: string | null,
  user: AuthUser | null,
  setAuth: (token: string, user?: AuthUser | null) => void,
  logout: () => void,
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user: user ?? null }),
      logout: () => {
        console.log('[GoldFlow] [auth.store] logout: clearing token, user, and entity cache')
        set({ token: null, user: null })
        try {
          localStorage.removeItem('goldflow-auth')
          clearEntityCache()
        } catch {
          // ignore
        }
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'goldflow-auth' }
  )
)
