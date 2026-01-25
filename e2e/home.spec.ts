import { test, expect } from "./coverage";

test("has title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Stride/);
});

test("has activities header link", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Activities")).toBeDefined();
});
