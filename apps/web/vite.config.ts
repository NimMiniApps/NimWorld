import { execSync } from 'node:child_process'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const authApiTarget = process.env.NIMWORLD_AUTH_API_TARGET?.trim() || 'http://localhost:8091'

/** Deploy stamp shown on the boot screen. Docker builds have no .git, so they pass the env var. */
function buildId(): string {
  const fromEnv = process.env.NIMWORLD_BUILD_ID?.trim()
  if (fromEnv) return fromEnv
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/catalog-api': {
        target: 'https://api.nimiqminiapps.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/catalog-api/, ''),
      },
      '/auth-api': {
        target: authApiTarget,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/auth-api/, ''),
      },
    },
  },
  test: {
    environment: 'node',
  },
})
