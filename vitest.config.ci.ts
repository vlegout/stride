import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { codecovVitePlugin } from '@codecov/vite-plugin';
import { execSync } from 'child_process';

// Vitest configuration for CI (unit tests only, no Storybook)
export default defineConfig(() => {
  let gitCommitSha = 'unknown';
  try {
    gitCommitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not get git commit SHA:', error);
  }

  return {
    plugins: [
      react(),
      svgr(),
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'stride',
        ...(process.env.CODECOV_TOKEN && { uploadToken: process.env.CODECOV_TOKEN }),
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(gitCommitSha),
    },
    test: {
      environment: 'jsdom',
      exclude: ['**/node_modules/**', '**/e2e/**'],
      globals: false,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
      coverage: {
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.tsx'],
        exclude: ['**/*.stories.tsx'],
      },
    },
  };
});
