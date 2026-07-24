import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For project Pages (username.github.io/repo-name/) set VITE_BASE_PATH=/repo-name/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
