import { test as setup } from "@playwright/test";

export const mockAuthState = {
  state: {
    user: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    },
    token: "mock-test-token",
    tokenExpiry: Date.now() + 24 * 60 * 60 * 1000, // Valid for 24 hours
  },
  version: 0,
};

export async function setupAuth(page: {
  evaluate: (fn: (state: typeof mockAuthState) => void, state: typeof mockAuthState) => Promise<void>;
}) {
  await page.evaluate((authState) => {
    localStorage.setItem("auth-storage", JSON.stringify(authState));
  }, mockAuthState);
}

setup("setup auth storage", async ({ page }) => {
  await page.goto("/");
  await setupAuth(page);
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
