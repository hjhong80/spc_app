import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const normalizeBasePath = (basePath = '/') => {
  const normalized = String(basePath || '').trim()
  if (!normalized || normalized === '/') {
    return '/'
  }

  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '')
  return `${withoutTrailingSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeBasePath(env.VITE_SPC_APP_BASE_PATH || '/')

  return {
    base,
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('/@mui/icons-material/')) {
              return 'mui-icons'
            }

            if (
              id.includes('/apexcharts/') ||
              id.includes('/react-apexcharts/') ||
              id.includes('/@mui/x-charts/') ||
              id.includes('/@mui/x-charts-vendor/') ||
              id.includes('/@mui/x-internals/') ||
              id.includes('/@mui/x-internal-gestures/')
            ) {
              return 'charts'
            }

            if (
              id.includes('/@tanstack/react-query/') ||
              id.includes('/@tanstack/query-core/') ||
              id.includes('/@tanstack/react-query-devtools/') ||
              id.includes('/@tanstack/query-devtools/')
            ) {
              return 'query'
            }

            if (id.includes('/exceljs/')) {
              return 'excel'
            }

            if (id.includes('/axios/')) {
              return 'network'
            }

            return undefined
          },
        },
      },
    },
  }
})
