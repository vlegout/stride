import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    process: JSON.stringify({ platform: 'browser', env: {} }),
  },
  optimizeDeps: {
    exclude: ['fsevents'],
  },
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
    globals: true,
    exclude: ['**/e2e/**', '**/node_modules/**'],
    include: ['tests/**/*.test.{ts,tsx}', 'vitest-example/**/*.test.{ts,tsx}'],
  },
})
