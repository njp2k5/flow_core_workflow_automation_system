import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ── GitHub MCP server (must be before /api catch-all) ─────────
      '/mcp': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mcp/, ''),
      },
      // ── FastAPI backend ──────────────────────────────────────────
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/developers': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/meetings': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/projects': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/srs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
