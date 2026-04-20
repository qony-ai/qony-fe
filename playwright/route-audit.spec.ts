import path from "node:path";

import { expect, test } from "@playwright/test";

const authFile = path.join(
  process.env.TMPDIR ?? "/tmp",
  "qony-route-audit-user.json",
);
const accountPassword = "pass12345";

test.use({ storageState: authFile });

test.beforeAll(async ({ browser }) => {
  const suffix = Date.now();
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();

  await page.goto("/register?next=%2Fdashboard");
  await page.getByLabel("Full name").fill(`Route Audit ${suffix}`);
  await page.getByLabel("Work email").fill(`route_audit_${suffix}@qony.test`);
  await page.getByPlaceholder("Use at least 8 characters").fill(accountPassword);
  await page.getByRole("button", { name: /Create Qony account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await context.storageState({ path: authFile });
  await context.close();
});

test("protected project and canvas routes open without runtime errors", async ({ page }) => {
  const runtimeErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    runtimeErrors.push(`${page.url()} :: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`${page.url()} :: ${message.text()}`);
    }
  });

  const routes = [
    "/dashboard",
    "/profile",
    "/project/new",
    "/project/ingest?projectId=case-empty-template",
    "/project/case-empty-template",
    "/project/case-retail-revenue",
    "/workspace/case-empty-template",
    "/workspace/case-retail-revenue",
    "/export/preview/case-empty-template",
    "/export/preview/case-retail-revenue",
    "/export/graph/case-empty-template",
    "/export/graph/case-retail-revenue",
  ];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.getByText("Application error: a server-side exception has occurred")).toHaveCount(
      0,
    );
    await expect(page.getByRole("heading").first()).toBeVisible();
  }

  await expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
  await expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
});
