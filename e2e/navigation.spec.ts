import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navigates to activities page from header", async ({ page }) => {
    await page.goto("/");

    await page.click('a[href="/activities"]');

    await expect(page).toHaveURL("/activities");
    await expect(page.getByRole("heading", { name: "Activities", exact: true })).toBeVisible();
  });

  test("navigates to home page from logo", async ({ page }) => {
    await page.goto("/activities");

    await page.click('a[href="/"]');

    await expect(page).toHaveURL("/");
  });

  test("header is visible on all pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Activities" })).toBeVisible();

    await page.goto("/activities");
    await expect(page.getByRole("link", { name: "Activities" })).toBeVisible();
  });

  test("footer is visible on home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("footer")).toBeVisible();
  });
});
