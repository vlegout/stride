import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { execSync } from "child_process";
import { codecovVitePlugin } from "@codecov/vite-plugin";
import istanbul from "vite-plugin-istanbul";

// https://vite.dev/config/
export default defineConfig(() => {
  let gitCommitSha = "unknown";
  try {
    gitCommitSha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn("Could not get git commit SHA:", error);
  }

  return {
    plugins: [
      react(),
      svgr(),
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: "stride",
        ...(process.env.CODECOV_TOKEN && { uploadToken: process.env.CODECOV_TOKEN }),
      }),
      ...(process.env.PLAYWRIGHT_COVERAGE === "true"
        ? [
            istanbul({
              include: "src/**/*",
              exclude: ["node_modules", "**/*.stories.tsx", "**/*.test.tsx"],
              extension: [".ts", ".tsx"],
              forceBuildInstrument: true,
            }),
          ]
        : []),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(gitCommitSha),
    },
    test: {
      environment: "jsdom",
      exclude: ["**/node_modules/**", "**/e2e/**"],
      globals: false,
      setupFiles: ["./tests/setup.ts"],
      coverage: {
        reporter: ["text", "json", "html", "lcov"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.stories.tsx"],
      },
    },
  };
});
