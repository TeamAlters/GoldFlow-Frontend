import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config()

const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api to your backend (e.g. Node/Express, Django, etc.)
      '/api': {
        target: apiBaseUrl,
        changeOrigin: true,
      },
    },
  },
})
