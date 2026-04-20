import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const authDir = path.join(process.cwd(), "playwright", ".auth");
const authFile = path.join(authDir, "browser-verify-user.json");
const accountPassword = "pass12345";

test.use({ storageState: authFile });

let accountEmail = "";
let displayName = "";

async function stubGoogleOAuth(page: import("@playwright/test").Page) {
  await page.route("https://accounts.google.com/**", async (route) => {
    await route.fulfill({
      body: "<html><body>Google OAuth stub</body></html>",
      contentType: "text/html",
      status: 200,
    });
  });
}

test.beforeAll(async ({ browser }) => {
  await mkdir(authDir, { recursive: true });

  const suffix = Date.now();
  accountEmail = `bv_${suffix}@qony.test`;
  displayName = `Browser Verify ${suffix}`;

  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();

  await page.goto("/register?next=%2Fpricing");
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  await page.getByLabel("Full name").fill(displayName);
  await page.getByLabel("Work email").fill(accountEmail);
  await page.getByPlaceholder("Use at least 8 characters").fill(accountPassword);
  await page.getByRole("button", { name: /Create Qony account/i }).click();
  await expect(page).toHaveURL(/\/pricing$/);

  await context.storageState({ path: authFile });
  await context.close();
});

test("auth pages expose Google OAuth entry points when provider config is present", async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();

  await stubGoogleOAuth(page);

  await page.goto("/login?next=%2Fpricing");
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();

  await page.goto("/register?next=%2Fpricing");
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();

  await page.goto("/login?next=%2Fpricing");
  await Promise.all([
    page.waitForURL(/accounts\.google\.com/),
    page.getByRole("button", { name: /Continue with Google/i }).click(),
  ]);
  await expect(page.getByText("Google OAuth stub")).toBeVisible();

  await context.close();
});

test("authenticated navigation shows session-aware header state after sign-in", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: authFile,
  });

  for (const route of ["/pricing", "/billing"]) {
    const page = await context.newPage();
    await page.goto(route);
    await expect(page.getByRole("link", { name: "Create account" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    await expect(page.getByText(displayName)).toBeVisible();
    await page.close();
  }

  await context.close();
});

test("pricing shows plan hierarchy and mock checkout resolves into the billing success state", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(
    page.getByRole("heading", {
      name: /Choose the plan that fits the maturity of your analysis workflow/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qony Free" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qony Pro" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Feature comparison/i }),
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/billing\/success\?/),
    page
      .locator("main")
      .getByRole("button", { name: /Upgrade to Pro/i })
      .first()
      .click(),
  ]);

  await expect(
    page.getByRole("heading", { name: /Payment successful/i }),
  ).toBeVisible();
  await expect(page.getByText(/What the frontend knows/i)).toBeVisible();
});

test("billing routes surface pending, failed, canceled, and dashboard summary states", async ({
  page,
}) => {
  await page.goto("/billing");
  await expect(
    page.getByRole("heading", { name: /Billing and subscription/i }),
  ).toBeVisible();
  await expect(page.getByText("Mock billing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qony Free" })).toBeVisible();

  for (const [route, title] of [
    [
      "/billing/pending?order_id=pending-order&payment_id=pending-payment&plan=pro&provider=mock&status=pending",
      /Payment pending/i,
    ],
    [
      "/billing/failed?order_id=failed-order&payment_id=failed-payment&plan=pro&provider=mock&status=failed",
      /Payment failed/i,
    ],
    [
      "/billing/cancel?order_id=cancel-order&payment_id=cancel-payment&plan=pro&provider=mock&status=cancel",
      /Checkout canceled/i,
    ],
  ] as const) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(/What the frontend knows/i)).toBeVisible();
  }
});
