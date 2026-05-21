/**
 * Required environment variables (loaded from .env.test):
 *   TEST_RELEASE_ID           - a valid releaseId in ACTIVE status
 *   TEST_BENEFICIARY_EMAIL    - email to register as a new beneficiary on the release
 *   TEST_BENEFICIARY_PASSWORD - password for that beneficiary account
 */

import { test, expect } from "@playwright/test";

const releaseId = process.env.TEST_RELEASE_ID ?? "test-release-id";
const beneficiaryEmail = process.env.TEST_BENEFICIARY_EMAIL ?? "";
const beneficiaryPassword = process.env.TEST_BENEFICIARY_PASSWORD ?? "";

async function loginAsBeneficiary(page: import("@playwright/test").Page) {
  await page.goto(`/release/${releaseId}/auth`);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.locator('input[name="email"]').fill(beneficiaryEmail);
  await page.locator('input[name="password"]').fill(beneficiaryPassword);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/login")),
    page.getByRole("button", { name: "Sign in →" }).click(),
  ]);
  await expect(page).toHaveURL(new RegExp(`/release/${releaseId}`), { timeout: 15000 });
}

test.describe("Release flow — unauthenticated → register → verify identity → confirmed", () => {
  test("unauthenticated visit to release page redirects to auth screen", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/release/${releaseId}`);

    await expect(page).toHaveURL(new RegExp(`/release/${releaseId}/auth`));
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("register as new beneficiary from release auth page", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/release/${releaseId}/auth`);

    // Default tab is "Create account"
    await page.getByRole("button", { name: "Create account" }).click();

    await page.locator('input[name="firstName"]').fill("Release");
    await page.locator('input[name="lastName"]').fill("Tester");
    await page.locator('input[name="email"]').fill(beneficiaryEmail);
    await page.locator('input[name="password"]').fill(beneficiaryPassword);
    await page.locator('input[name="confirmPassword"]').fill(beneficiaryPassword);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          (r.url().includes("/auth/register") || r.url().includes("/release")) &&
          r.request().method() !== "GET"
      ),
      page.getByRole("button", { name: "Create account →" }).click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`/release/${releaseId}(/verify)?$`));
  });

  test("release landing page shows verify CTA", async ({ page }) => {
    await loginAsBeneficiary(page);
    await page.goto(`/release/${releaseId}`);

    await expect(page).toHaveURL(new RegExp(`/release/${releaseId}$`));
    await expect(page.getByText(/named as a beneficiary/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /verify my identity/i })).toBeVisible();
  });

  test("upload identity document on verify page", async ({ page }) => {
    await loginAsBeneficiary(page);
    await page.goto(`/release/${releaseId}/verify`);

    await page.getByPlaceholder("As it appears on your ID").fill("Release Tester");

    // Minimal valid JPEG buffer
    const fileContent = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKf/Z",
      "base64"
    );
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "id-doc.jpg",
      mimeType: "image/jpeg",
      buffer: fileContent,
    });

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          (r.url().includes("/release") || r.url().includes("/verify")) &&
          r.request().method() !== "GET"
      ),
      page.getByRole("button", { name: "Submit verification →" }).click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`/release/${releaseId}/confirmed`));
  });

  test("confirmed screen is shown after successful verification", async ({ page }) => {
    await loginAsBeneficiary(page);
    await page.goto(`/release/${releaseId}/confirmed`);

    await expect(page).toHaveURL(new RegExp(`/release/${releaseId}/confirmed`));
    await expect(page.getByText(/confirmed|verified|success/i)).toBeVisible();
  });
});
