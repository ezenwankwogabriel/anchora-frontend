/**
 * Required environment variables (loaded from .env.test):
 *   TEST_NEW_EMAIL    - unique email for the signup flow (unused inbox is fine)
 *   TEST_NEW_PASSWORD - password to use for the new account
 */

import { test, expect } from "@playwright/test";

const newEmail = process.env.TEST_NEW_EMAIL ?? "";
const newPassword = process.env.TEST_NEW_PASSWORD ?? "";

test.describe("Acquisition tracking — UTM handoff to registration", () => {
  test("UTM params on /signup are attached to the register request", async ({ page }) => {
    await page.goto(
      "/signup?acq_source=google&acq_medium=cpc&acq_campaign=spring-launch",
    );

    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("User");
    await page.locator('input[name="email"]').fill(newEmail);
    await page.locator('input[name="password"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.locator('input[name="termsAccepted"]').check();
    await page.locator('input[name="privacyAccepted"]').check();

    const [request] = await Promise.all([
      page
        .waitForRequest((r) => r.url().includes("/auth/register") && r.method() === "POST"),
      page.getByRole("button", { name: "Create account →" }).click(),
    ]);

    const body = request.postDataJSON();
    expect(body.acquisitionSource).toBe("google");
    expect(body.acquisitionMedium).toBe("cpc");
    expect(body.acquisitionCampaign).toBe("spring-launch");

    await expect(page).toHaveURL(/\/verify-email/);
  });

  test("direct signup with no UTM params sends null acquisition fields without error", async ({ page }) => {
    await page.goto("/signup");

    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("User");
    await page.locator('input[name="email"]').fill(`no-utm-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.locator('input[name="termsAccepted"]').check();
    await page.locator('input[name="privacyAccepted"]').check();

    const [request] = await Promise.all([
      page
        .waitForRequest((r) => r.url().includes("/auth/register") && r.method() === "POST"),
      page.getByRole("button", { name: "Create account →" }).click(),
    ]);

    const body = request.postDataJSON();
    expect(body.acquisitionSource === null || body.acquisitionSource === undefined).toBe(true);
    expect(body.acquisitionMedium === null || body.acquisitionMedium === undefined).toBe(true);

    await expect(page).toHaveURL(/\/verify-email/);
  });
});
