import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BACKEND_URL lets Docker Compose point the dev-server proxy at the
// backend container by name (http://backend:8000) instead of localhost.
const backendUrl = process.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
