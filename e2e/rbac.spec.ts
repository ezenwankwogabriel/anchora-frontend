/**
 * Required environment variables (loaded from .env.test):
 *   TEST_OWNER_EMAIL             - email of an asset owner account
 *   TEST_OWNER_PASSWORD          - password for the owner account
 *   TEST_READONLY_ADMIN_EMAIL    - email of a READ_ONLY admin account
 *   TEST_READONLY_ADMIN_PASSWORD - password for the read-only admin account
 *   TEST_BENEFICIARY_EMAIL       - email of a beneficiary account
 *   TEST_BENEFICIARY_PASSWORD    - password for the beneficiary account
 */

import { test, expect } from "@playwright/test";

const ownerEmail = process.env.TEST_OWNER_EMAIL ?? "";
const ownerPassword = process.env.TEST_OWNER_PASSWORD ?? "";
const readonlyAdminEmail = process.env.TEST_READONLY_ADMIN_EMAIL ?? "";
const readonlyAdminPassword = process.env.TEST_READONLY_ADMIN_PASSWORD ?? "";
const beneficiaryEmail = process.env.TEST_BENEFICIARY_EMAIL ?? "";
const beneficiaryPassword = process.env.TEST_BENEFICIARY_PASSWORD ?? "";

async function loginAsReadonlyAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("admin@anchora.co.uk").fill(readonlyAdminEmail);
  await page.locator('input[name="password"]').fill(readonlyAdminPassword);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/admin/auth/login")),
    page.getByRole("button", { name: "Sign in →" }).click(),
  ]);
  await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15000 });
}

test.describe("RBAC — role-based access enforcement", () => {
  test("READ_ONLY admin sees no action buttons on user list", async ({ page }) => {
    await loginAsReadonlyAdmin(page);
    // Already on /admin/users after login — wait for data
    await page.waitForResponse((r) => r.url().includes("/api/admin/users") && r.request().method() === "GET");

    await expect(page.getByRole("button", { name: "Suspend" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reactivate" })).toHaveCount(0);
  });

  test("READ_ONLY admin sees no action buttons on user detail", async ({ page }) => {
    await loginAsReadonlyAdmin(page);
    // Already on /admin/users — wait for the initial data load
    await page.waitForResponse((r) => r.url().includes("/api/admin/users") && r.request().method() === "GET");

    // Open the first user via soft-nav link (preserves Zustand)
    await page.locator("table tbody tr a").first().click();
    await expect(page).toHaveURL(/\/admin\/users\/.+/, { timeout: 15000 });

    await expect(page.getByRole("button", { name: "Suspend" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reactivate" })).toHaveCount(0);
  });

  test("asset owner cannot access /admin routes", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(ownerEmail);
    await page.locator('input[name="password"]').fill(ownerPassword);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);
    await expect(page).toHaveURL(/\/dashboard|\/mfa-setup/, { timeout: 15000 });

    await page.goto("/admin/users");
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test("owner credentials are rejected at /admin/login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("admin@anchora.co.uk").fill(ownerEmail);
    await page.locator('input[name="password"]').fill(ownerPassword);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin") && r.request().method() !== "GET"),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText(/unauthorized|invalid|not found|incorrect/i)).toBeVisible();
  });

  test("beneficiary is never redirected to /dashboard after login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(beneficiaryEmail);
    await page.locator('input[name="password"]').fill(beneficiaryPassword);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);

    // Allow redirects to settle
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test("beneficiary cannot access /vault/add", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(beneficiaryEmail);
    await page.locator('input[name="password"]').fill(beneficiaryPassword);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.getByRole("button", { name: "Sign in →" }).click(),
    ]);
    await page.waitForLoadState("networkidle");

    await page.goto("/vault/add");
    await expect(page).not.toHaveURL(/\/vault\/add/);
  });

  test("unauthenticated user is redirected away from /dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user is redirected away from /admin/users", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin/users");
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });
});
