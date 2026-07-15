/**
 * Required environment variables (loaded from .env.test):
 *   TEST_OWNER_EMAIL     - email of an asset owner account
 *   TEST_OWNER_PASSWORD  - password for that account
 *
 * Runs against the real Dojah sandbox API (POST /identity/verify-nin) using
 * a fake camera device — no mocking. Like the password-change test in
 * owner.spec.ts, this permanently mutates the owner's verification status;
 * re-run `db:seed:e2e` between full suite runs to reset it.
 */

import { test, expect } from "@playwright/test";

const ownerEmail = process.env.TEST_OWNER_EMAIL ?? "";
const ownerPassword = process.env.TEST_OWNER_PASSWORD ?? "";

// Dojah sandbox test NIN — see https://docs.dojah.io/docs/nigeria/lookup-nin
const SANDBOX_NIN = "70123456789";

test.use({
  permissions: ["camera"],
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

async function loginAsOwner(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(ownerEmail);
  await page.locator('input[name="password"]').fill(ownerPassword);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/login")),
    page.getByRole("button", { name: "Sign in →" }).click(),
  ]);
  await expect(page).toHaveURL(/\/dashboard|\/mfa-setup/, { timeout: 15000 });
}

test.describe("Owner — identity verification (NIN + selfie)", () => {
  test("verify identity via NIN and a live selfie", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/settings?tab=" + encodeURIComponent("Identity Verification"));

    await page.getByRole("button", { name: "Verify identity" }).click();
    await expect(
      page.getByRole("button", { name: "Capture selfie" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Capture selfie" }).click();
    await expect(
      page.getByRole("button", { name: "Submit for verification" }),
    ).toBeVisible();

    await page.locator('input[placeholder="12345678901"]').fill(SANDBOX_NIN);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/identity/verify-nin") &&
          r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Submit for verification" }).click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByText(/^Verified /)).toBeVisible({ timeout: 15000 });
  });
});
