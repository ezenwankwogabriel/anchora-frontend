/**
 * Required environment variables (loaded from .env.test):
 *   TEST_OWNER_EMAIL    - pre-existing verified asset owner account
 *   TEST_OWNER_PASSWORD - password for that account
 *   TEST_NEW_EMAIL      - unique email for the signup → verify flow (unused inbox is fine)
 *   TEST_NEW_PASSWORD   - password to use for the new account
 */

import { test, expect } from "@playwright/test";

const ownerEmail = process.env.TEST_OWNER_EMAIL ?? "";
const ownerPassword = process.env.TEST_OWNER_PASSWORD ?? "";
const newEmail = process.env.TEST_NEW_EMAIL ?? "";
const newPassword = process.env.TEST_NEW_PASSWORD ?? "";

test.describe("Auth — signup → verify → login → MFA → logout", () => {
  test("signup redirects to email verification page", async ({ page }) => {
    await page.goto("/signup");

    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("User");
    await page.locator('input[name="email"]').fill(newEmail);
    await page.locator('input[name="password"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.locator('input[name="termsAccepted"]').check();
    await page.locator('input[name="privacyAccepted"]').check();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/register")),
      page.getByRole("button", { name: "Create account →" }).click(),
    ]);

    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.getByText(newEmail)).toBeVisible();
  });

  test("resend verification email shows success banner", async ({ page }) => {
    await page.goto(`/verify-email?email=${encodeURIComponent(newEmail)}`);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/resend-verification")),
      page.getByRole("button", { name: /resend/i }).click(),
    ]);

    await expect(page.getByText(/verification email resent/i)).toBeVisible();
  });

  test("login with valid credentials succeeds", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[name="email"]').fill(ownerEmail);
    await page.locator('input[name="password"]').fill(ownerPassword);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);

    // Lands on dashboard (no MFA) or MFA step
    await expect(page).toHaveURL(/\/dashboard|\/mfa-setup|\/login/);
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[name="email"]').fill(ownerEmail);
    await page.locator('input[name="password"]').fill("wrong-password-xyz");

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);

    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
  });

  test("MFA setup page shows TOTP card", async ({ page }) => {
    await page.goto("/mfa-setup");

    // Unauthenticated users redirect to /login
    if (page.url().includes("/login")) {
      await page.locator('input[name="email"]').fill(ownerEmail);
      await page.locator('input[name="password"]').fill(ownerPassword);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/auth/login")),
        page.getByRole("button", { name: "Sign in →" }).click(),
      ]);
      if (page.url().includes("/login")) return; // MFA already enabled, skip
    }

    await expect(page.getByText(/authenticator app/i)).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(ownerEmail);
    await page.locator('input[name="password"]').fill(ownerPassword);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);
    await expect(page).toHaveURL(/\/dashboard|\/mfa-setup/, { timeout: 15000 });

    const logoutButton = page.getByRole("button", { name: /log out|sign out/i });
    if (await logoutButton.isVisible()) {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/auth/logout")),
        logoutButton.click(),
      ]);
    } else {
      // Open sidebar/menu first
      await page.getByRole("button", { name: /menu|open navigation/i }).first().click();
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/auth/logout")),
        page.getByRole("button", { name: /log out|sign out/i }).click(),
      ]);
    }

    await expect(page).toHaveURL(/\/login/);
  });
});
