import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// Vitest configuration
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/*.stories.tsx', '**/*.d.ts', '**/vite-env.d.ts'],
    },
    projects: [
      // Regular unit tests
      {
        plugins: [react(), svgr()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/e2e/**'],
          globals: false,
          setupFiles: ['./tests/setup.ts'],
        },
      },
      // Storybook tests
      {
        plugins: [
          react(),
          svgr(),
          storybookTest({
            configDir: path.join(__dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          coverage: {
            provider: 'istanbul',
            reportsDirectory: './coverage-storybook',
            include: ['src/**/*.tsx', 'src/**/*.ts'],
            exclude: ['**/*.stories.tsx', '**/*.d.ts', '**/vite-env.d.ts'],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});