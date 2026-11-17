import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // WSL does not deliver file-change events for projects on a Windows
    // drive (/mnt/c/...), so edits never reached the browser. Poll there.
    watch: process.cwd().startsWith('/mnt/') ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      // The backend has no CORS configuration, so dev calls go through this
      // proxy using the default relative `/api/v1` base URL.
      // DEV_API_PROXY=https://api.getfixth.com points local dev at the live
      // API instead of a backend running on this machine.
      '/api': {
        target: process.env.DEV_API_PROXY || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
