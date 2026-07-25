import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub project site: kamclaughlinn.github.io/kammit.dev/
  base: command === 'build' ? '/kammit.dev/' : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
}))
