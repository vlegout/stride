import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return {
      ...config,
      define: {
        ...config.define,
        __STORYBOOK__: true,
      },
      resolve: {
        ...config.resolve,
        alias: [
          ...(Array.isArray(config.resolve?.alias)
            ? config.resolve.alias
            : Object.entries(config.resolve?.alias ?? {}).map(([find, replacement]) => ({ find, replacement }))),
          { find: "mapbox-gl/dist/mapbox-gl.css", replacement: path.resolve(__dirname, "./mocks/mapbox-gl.css") },
          { find: /^mapbox-gl$/, replacement: path.resolve(__dirname, "./mocks/mapbox-gl.ts") },
        ],
      },
    };
  },
};
export default config;
