import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), svgr()],
    publicDir: mode === "development" ? "pub" : "public",
  };
});
