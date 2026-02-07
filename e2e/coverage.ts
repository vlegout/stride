import { test as baseTest } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const coverageDir = path.join(process.cwd(), ".nyc_output");

export const test = baseTest.extend({
  page: async ({ page }, runTest) => {
    await runTest(page);

    if (process.env.PLAYWRIGHT_COVERAGE === "true") {
      const coverage = await page.evaluate(() => {
        return (window as unknown as { __coverage__?: object }).__coverage__;
      });

      if (coverage) {
        if (!fs.existsSync(coverageDir)) {
          fs.mkdirSync(coverageDir, { recursive: true });
        }
        const coverageFile = path.join(coverageDir, `coverage-${randomUUID()}.json`);
        fs.writeFileSync(coverageFile, JSON.stringify(coverage));
      }
    }
  },
});

export { expect } from "@playwright/test";
