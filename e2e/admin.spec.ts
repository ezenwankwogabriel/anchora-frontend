/**
 * Required environment variables (loaded from .env.test):
 *   TEST_ADMIN_EMAIL      - email of an ADMIN-role account
 *   TEST_ADMIN_PASSWORD   - password for that admin account
 *   TEST_TARGET_USER_ID   - ID of a dedicated test user for suspend/reactivate
 *
 * After login the admin store lives in-memory. All post-login navigation uses
 * Next.js Link clicks (soft nav) to keep the store alive — never page.goto().
 */

import { test, expect } from "@playwright/test";

const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "";
const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
const targetUserId = process.env.TEST_TARGET_USER_ID ?? "";

/** Logs in and lands on /admin/users (soft-nav, Zustand intact). */
async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("admin@anchora.co.uk").fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/admin/auth/login")),
    page.getByRole("button", { name: "Sign in →" }).click(),
  ]);
  // Wait for the redirect to /admin/users — be specific to avoid matching /admin/login
  await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15000 });
}

/** Clicks a sidebar nav link (soft nav, preserves Zustand store). */
async function navTo(page: import("@playwright/test").Page, label: string, urlPattern: RegExp) {
  await page.getByRole("link", { name: label }).click();
  await expect(page).toHaveURL(urlPattern, { timeout: 15000 });
}

test.describe("Admin — users, releases, audit log", () => {
  test("admin login succeeds and lands on user list", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("user list renders a table with rows", async ({ page }) => {
    await loginAsAdmin(page);
    // Already on /admin/users — wait for the API call the page fires on mount
    await page.waitForResponse((r) => r.url().includes("/api/admin/users") && r.request().method() === "GET");
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("search narrows user list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForResponse((r) => r.url().includes("/api/admin/users") && r.request().method() === "GET");

    const searchInput = page.getByPlaceholder(/search by name or email/i);
    await searchInput.fill("test");

    await page.waitForResponse(
      (r) => r.url().includes("/api/admin/users") && r.request().method() === "GET"
    );
    await expect(searchInput).toHaveValue("test");
  });

  test("open user detail page via row link", async ({ page }) => {
    await loginAsAdmin(page);
    // Soft-nav via the row link — preserves Zustand
    await page.locator(`a[href="/admin/users/${targetUserId}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/users/${targetUserId}`), { timeout: 15000 });
    await expect(page.getByText(/email|joined/i)).toBeVisible();
  });

  test("suspend a user", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator(`a[href="/admin/users/${targetUserId}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/users/${targetUserId}`), { timeout: 15000 });

    await page.getByRole("button", { name: "Suspend" }).click();
    await page.getByPlaceholder(/suspicious activity/i).fill("E2E test suspension");

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(`/admin/users/${targetUserId}/suspend`) && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Suspend account" }).click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByText(/suspended/i)).toBeVisible();
  });

  test("reactivate a suspended user", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator(`a[href="/admin/users/${targetUserId}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/users/${targetUserId}`), { timeout: 15000 });

    await page.getByRole("button", { name: "Reactivate" }).first().click();

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(`/admin/users/${targetUserId}/reactivate`) && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Reactivate" }).last().click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByText(/active/i)).toBeVisible();
  });

  test("view releases list", async ({ page }) => {
    await loginAsAdmin(page);
    await navTo(page, "Releases", /\/admin\/releases/);
    await page.waitForResponse((r) => r.url().includes("/api/admin/releases") && r.request().method() === "GET");
    await expect(page.getByRole("heading", { name: "Releases" })).toBeVisible();
  });

  test("view audit log", async ({ page }) => {
    await loginAsAdmin(page);
    await navTo(page, "Audit Logs", /\/admin\/audit-logs/);
    await page.waitForResponse((r) => r.url().includes("/api/admin/audit-logs") && r.request().method() === "GET");
    await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible();
  });
});
