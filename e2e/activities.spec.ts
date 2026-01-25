import { test, expect } from "@playwright/test";

test.describe("Activities Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/activities");
    await expect(page.getByRole("heading", { name: "Activities", exact: true })).toBeVisible();
  });

  test("displays activities heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Activities", exact: true })).toBeVisible();
  });

  test("displays sport filter", async ({ page }) => {
    await expect(page.getByLabel("Sport")).toBeVisible();
  });

  test("displays race filter checkbox", async ({ page }) => {
    await expect(page.getByLabel("Race")).toBeVisible();
  });

  test("displays distance slider", async ({ page }) => {
    await expect(page.getByText("Distance")).toBeVisible();
    await expect(page.getByRole("slider").first()).toBeVisible();
  });

  test("race checkbox can be toggled", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test("sport filter can be changed", async ({ page }) => {
    const sportSelect = page.getByLabel("Sport");
    await sportSelect.click();

    await expect(page.getByRole("option", { name: "Running" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Cycling" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Swimming" })).toBeVisible();
  });
});
