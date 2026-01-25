import { test, expect } from "@playwright/test";

test.describe("Activities Page", () => {
  test("displays activities heading", async ({ page }) => {
    await page.goto("/activities");

    await expect(page.getByRole("heading", { name: "Activities" })).toBeVisible();
  });

  test("displays sport filter", async ({ page }) => {
    await page.goto("/activities");

    await expect(page.getByText("Sport")).toBeVisible();
  });

  test("displays race filter checkbox", async ({ page }) => {
    await page.goto("/activities");

    await expect(page.getByText("Race")).toBeVisible();
    await expect(page.getByRole("checkbox")).toBeVisible();
  });

  test("displays distance slider", async ({ page }) => {
    await page.goto("/activities");

    await expect(page.getByText("Distance")).toBeVisible();
    await expect(page.getByRole("slider")).toBeVisible();
  });

  test("race checkbox can be toggled", async ({ page }) => {
    await page.goto("/activities");

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test("sport filter can be changed", async ({ page }) => {
    await page.goto("/activities");

    const sportSelect = page.locator('[id^="mui-component-select"]').first();
    await sportSelect.click();

    await expect(page.getByRole("option", { name: "Running" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Cycling" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Swimming" })).toBeVisible();
  });
});
