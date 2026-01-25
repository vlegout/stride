import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("displays login page with Google sign-in", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Welcome to Stride" })).toBeVisible();
  });

  test("shows Stride branding on login page", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Stride/);
  });

  test("redirects unauthenticated users from protected routes", async ({ page }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated users from upload page", async ({ page }) => {
    await page.goto("/upload");

    await expect(page).toHaveURL(/login/);
  });
});
