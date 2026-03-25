import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const authDir = path.join(process.cwd(), "playwright", ".auth");
const authFile = path.join(authDir, "browser-verify-user.json");

test.use({ storageState: authFile });

let username = "";
let displayName = "";

function buildDisplayName(value: string) {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
  description: string,
) {
  await page.goto("/project/new");
  await page.getByLabel("Project name").fill(name);
  await page.getByLabel("Detail").fill(description);
  await page.getByRole("button", { name: /Continue to ingest/i }).click();
  await expect(page).toHaveURL(/\/project\/ingest\?projectId=/);

  const projectId = new URL(page.url()).searchParams.get("projectId");
  expect(projectId).not.toBeNull();
  return projectId as string;
}

async function ingestUploadedFile(
  page: import("@playwright/test").Page,
  rootTitle: string,
) {
  const uploadRow = page.locator("div.flex.items-center.gap-4").filter({
    hasText: "Upload source material",
  });
  const parsingRow = page.locator("div.flex.items-center.gap-4").filter({
    hasText: "Extract structure and generate graph",
  });
  const completeRow = page.locator("div.flex.items-center.gap-4").filter({
    hasText: "Preview extracted context",
  });

  await page.route("**/api/qony/ingest", async (route) => {
    await page.waitForTimeout(700);
    await route.continue();
  });

  await page.locator('input[type="file"]').setInputFiles({
    name: "brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      `${rootTitle}. This upload should move through uploading, parsing, and complete before we continue the workspace verification.`,
    ),
  });
  await page.getByRole("button", { name: /Run ingest/i }).click();

  await expect(uploadRow.locator("svg")).toHaveCount(1);
  await expect(parsingRow.locator("svg")).toHaveCount(0);
  await page.waitForTimeout(320);
  await expect(parsingRow.locator("svg")).toHaveCount(1);
  await expect(completeRow.locator("svg")).toHaveCount(0);
  await expect(page.getByText(/Ingest complete: \d+ nodes, \d+ edges\./i)).toBeVisible();
}

test.beforeAll(async ({ browser }) => {
  await mkdir(authDir, { recursive: true });

  const suffix = Date.now();
  username = `bv_${suffix}`;
  displayName = buildDisplayName(username);

  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();

  await page.goto("/register?next=%2Fdashboard");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("pass1234");
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await context.storageState({ path: authFile });
  await context.close();
});

test("authenticated protected pages render with user header state in initial browser HTML", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    storageState: authFile,
  });

  for (const route of [
    "/dashboard",
    "/project/case-retail-revenue",
    "/project/ingest?projectId=case-retail-revenue",
    "/export/preview/case-retail-revenue",
  ]) {
    const page = await context.newPage();
    await page.goto(route);
    await expect(page.getByText("Register")).toHaveCount(0);
    await expect(page.getByText("Login")).toHaveCount(0);
    await expect(page.getByText(displayName)).toBeVisible();
    await page.close();
  }

  await context.close();
});

test("newly created projects are immediately available on the ingest route after creation", async ({
  page,
}) => {
  const projectName = `Browser Freshness ${Date.now()}`;
  const projectId = await createProject(
    page,
    projectName,
    "Freshness verification project created during the final browser-driven QA pass.",
  );
  const projectSelect = page.getByLabel("Target project");

  await expect.soft(projectSelect).toHaveValue(projectId);
  await expect.soft(page.getByText(`Project ${projectId} not found.`)).toHaveCount(0);

  await page.reload();

  await expect(projectSelect).toHaveValue(projectId);
  await expect(page.getByText(`Project ${projectId} not found.`)).toHaveCount(0);
});

test("ingest progress is visible, downstream routes stay fresh after ingest, and workspace drag stays freely draggable", async ({
  page,
}) => {
  const projectId = "case-empty-template";
  const projectName = "Blank Strategic Case";
  const rootTitle = `Browser Root ${Date.now()}`;

  await page.goto(`/project/ingest?projectId=${projectId}`);
  await expect(page.getByLabel("Target project")).toHaveValue(projectId);

  await ingestUploadedFile(page, rootTitle);

  await page.goto("/dashboard");
  await page.getByPlaceholder("Search cases, descriptions, or status").fill(projectName);
  const dashboardCard = page.locator("article").filter({ hasText: projectName }).first();
  await expect(dashboardCard).toBeVisible();
  await expect(dashboardCard.getByText("active")).toBeVisible();
  await page.reload();
  await expect(dashboardCard).toBeVisible();

  await page.goto(`/project/${projectId}`);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("2 edges across the current canvas")).toBeVisible();
  await page.reload();
  await expect(page.getByText("2 edges across the current canvas")).toBeVisible();

  await page.goto(`/workspace/${projectId}`);
  const rootNode = page.locator(".react-flow__node").filter({ hasText: rootTitle }).first();
  await expect(rootNode).toBeVisible();
  const beforeBox = await rootNode.boundingBox();
  expect(beforeBox).not.toBeNull();

  await page.mouse.move(beforeBox!.x + beforeBox!.width / 2, beforeBox!.y + 24);
  await page.mouse.down();
  await page.mouse.move(beforeBox!.x + 260, beforeBox!.y + 80, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      const afterBox = await rootNode.boundingBox();
      return afterBox ? Math.round(afterBox.x - beforeBox!.x) : null;
    })
    .toBeGreaterThan(120);
  await page.reload();
  await expect(rootNode).toBeVisible();

  await page.goto(`/export/preview/${projectId}`);
  await expect(
    page.getByText("No complete rank-1-to-rank-6 branch is available yet. Finish at least one branch before exporting."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("No complete rank-1-to-rank-6 branch is available yet. Finish at least one branch before exporting."),
  ).toBeVisible();
});

test("dashboard quick links follow visible context and delete uses a real confirmation flow", async ({
  page,
}) => {
  const deleteProjectName = `Browser Delete ${Date.now()}`;
  await createProject(
    page,
    deleteProjectName,
    "Delete confirmation coverage project for the browser-driven QA pass.",
  );

  await page.goto("/dashboard");
  const searchInput = page.getByPlaceholder("Search cases, descriptions, or status");

  await searchInput.fill("Blank Strategic Case");
  await expect(page.getByText("1 visible")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open project detail/i })).toHaveAttribute(
    "href",
    "/project/case-empty-template",
  );

  await searchInput.fill(deleteProjectName);
  const deleteCard = page.locator("article").filter({ hasText: deleteProjectName }).first();
  await expect(deleteCard).toBeVisible();

  page.once("dialog", (dialog) => dialog.dismiss());
  await deleteCard.getByRole("button", { name: /Delete project/i }).click();
  await expect(deleteCard).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await deleteCard.getByRole("button", { name: /Delete project/i }).click();
  await expect(deleteCard).toHaveCount(0);
});

test("workspace surfaces actionable validation issues and project detail status flips to review state", async ({
  page,
}) => {
  const projectId = "case-empty-template";
  await page.getByPlaceholder(
    "Paste the case brief, working notes, or extracted text from your source material.",
  ).fill(
    "Validation root. This plain text ingest creates a small valid workspace before we intentionally break it in the browser.",
  );
  await page.goto(`/project/ingest?projectId=${projectId}`);
  await page.getByLabel("Replace the current workspace graph for this project").check();
  await page.getByRole("button", { name: /Run ingest/i }).click();
  await expect(page.getByText(/Ingest complete: \d+ nodes, \d+ edges\./i)).toBeVisible();

  await page.goto(`/workspace/${projectId}`);
  await page.locator(".react-flow__node").filter({ hasText: "Validation root" }).first().click();
  await page.getByRole("button", { name: /^Delete$/i }).click();
  await expect(
    page.getByText(/validation issue\(s\) are blocking export/i),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Inspect linked node/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /Inspect linked node/i }).first().click();
  await expect(page.getByText(/Rank 2/i).first()).toBeVisible();

  await page.goto(`/project/${projectId}`);
  await expect(page.getByText("Needs review")).toBeVisible();
  await expect(page.getByText(/issue\(s\) need attention in the canvas\./i)).toBeVisible();
  const validationCard = page
    .getByText("Graph validation")
    .locator('xpath=ancestor::div[contains(@class, "rounded-[24px]")][1]');
  await expect(validationCard).toHaveClass(/bg-lime-300\/10/);
});
