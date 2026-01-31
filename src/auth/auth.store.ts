import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: 'goldflow-auth' }
  )
)
