import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mirrors the `@/*` path mapping in tsconfig.json so bundling agrees with tsc.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Pinned to 3000 to match the CORS allow-list in application.properties
    // and the Playwright baseURL. Vite's default (5173) would silently mismatch.
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/q': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
