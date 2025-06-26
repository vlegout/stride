import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// Vitest configuration for Storybook integration
export default defineConfig({
  test: {
    projects: [
      // Regular tests
      {
        extends: './vite.config.ts',
        test: {
          name: 'unit',
          include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
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
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});