import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub project site: kamclaughlinn.github.io/kammit.dev/
  base: mode === 'production' ? '/kammit.dev/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
}))
