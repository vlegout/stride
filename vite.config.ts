import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), svgr()],
    test: {
      environment: 'jsdom',
      exclude: ['**/tests/**', '**/node_modules/**'],
    },
  };
});
