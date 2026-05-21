/**
 * Required environment variables (loaded from .env.test):
 *   TEST_OWNER_EMAIL        - email of an asset owner account
 *   TEST_OWNER_PASSWORD     - password for that account
 *   TEST_BENEFICIARY_EMAIL  - email for the beneficiary to be added
 *   TEST_NEW_PASSWORD       - new password used in the change-password test
 *   TEST_CURRENT_PASSWORD   - current password (same as TEST_OWNER_PASSWORD unless changed)
 */

import { test, expect } from "@playwright/test";

const ownerEmail = process.env.TEST_OWNER_EMAIL ?? "";
const ownerPassword = process.env.TEST_OWNER_PASSWORD ?? "";
const beneficiaryEmail = process.env.TEST_BENEFICIARY_EMAIL ?? "";
const newPassword = process.env.TEST_NEW_PASSWORD ?? "";
const currentPassword = process.env.TEST_CURRENT_PASSWORD ?? ownerPassword;

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

test.describe("Owner — vault record, beneficiary, settings, password", () => {
  test("add a BANK_ACCOUNT vault record", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/vault/add");

    // Step 0: choose category
    await page.getByText("Bank Account").click();
    await page.getByRole("button", { name: "Continue →" }).click();

    // Step 1: fill asset details
    await page.locator('input[name="institutionName"]').fill("Test Bank");
    await page.locator('select[name="accountType"]').selectOption("Savings");
    await page.locator('input[name="usernameOrEmail"]').fill("0123456789");

    const [detailsResponse] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/vault/records") && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Continue →" }).click(),
    ]);

    expect(detailsResponse.status()).toBeLessThan(400);

    // Step 2: beneficiary assignment — confirm with no selection
    const continueBtn = page.getByRole("button", { name: /continue|save/i });
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    await expect(page).toHaveURL(/\/dashboard|\/vault/);
  });

  test("add a beneficiary", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/beneficiaries");

    // Click whichever add button is visible (empty state vs. populated list)
    const addBtn = page.getByRole("button", { name: /add beneficiary|add your first beneficiary/i }).first();
    await addBtn.click();

    await page.locator('input[name="name"]').fill("Jane Test");
    await page.locator('input[name="email"]').fill(beneficiaryEmail);
    await page.locator('select[name="relationship"]').selectOption("FRIEND");

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/beneficiaries") && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Add beneficiary →" }).click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByText(/beneficiary added/i)).toBeVisible();
  });

  test("visit settings page", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("change password from settings security tab", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/settings");

    // Navigate to Security tab
    await page.getByRole("button", { name: "Security" }).click();

    await page.locator('input[name="currentPassword"]').fill(currentPassword);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/auth/change-password") && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Update password" }).click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByText("Password updated successfully.")).toBeVisible();
  });
});
