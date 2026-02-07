import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: false, // false = light, true = dark
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (isDark: boolean) => set({ isDarkMode: isDark }),
    }),
    {
      name: 'ui-theme-storage',
    }
  )
);
