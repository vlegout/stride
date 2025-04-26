import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Sport/);
});

test('has activities header link', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Activities' })).toBeVisible();
});
