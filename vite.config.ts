import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

/**
 * Where the browser sends API calls under `vite` and `vite preview`. The proxy forwards them to
 * REACT_APP_API_URL, so the API needs no CORS setup. It has its own prefix because the UI's routes
 * (/workspaces, /categories, ...) share names with the API's. Keep in sync with src/services/apiClient.ts.
 */
const API_PROXY_PREFIX = '/dam-api'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite only exposes VITE_* variables by default; REACT_APP_API_URL (spec 022) needs its prefix too.
  const envPrefix = ['VITE_', 'REACT_APP_']
  const apiUrl = loadEnv(mode, process.cwd(), envPrefix).REACT_APP_API_URL?.trim()

  const proxy: Record<string, ProxyOptions> | undefined = apiUrl
    ? {
        [API_PROXY_PREFIX]: {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.slice(API_PROXY_PREFIX.length) || '/',
          // When the API is down, answer 502 with no body; apiClient reports that as unreachable.
          configure: (server) => {
            server.on('error', (_err, _req, res) => {
              if ('writeHead' in res && !res.headersSent) res.writeHead(502).end()
            })
          },
        },
      }
    : undefined

  return {
    plugins: [react()],
    envPrefix,
    server: { proxy },
    preview: { proxy },
  }
})
