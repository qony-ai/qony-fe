import test from "node:test";
import assert from "node:assert/strict";

import {
  getMockWorkspace,
  mockGetExportPreview,
  mockIngestProject,
  mockListProjects,
  resetMockDatabase,
} from "@/src/lib/api/mock-store";

test.beforeEach(() => {
  resetMockDatabase();
});

test("mockListProjects exposes seeded cases", async () => {
  const response = await mockListProjects();

  assert.ok(response.data.items.length >= 3);
  assert.equal(response.data.items[0]?.id, "case-retail-revenue");
});

test("mockIngestProject replaces workspace graph with extracted structure", async () => {
  const response = await mockIngestProject({
    project_id: "case-empty-template",
    raw_text:
      "Revenue is declining in the north region because discounting is too broad and store execution is inconsistent.",
    replace_existing: true,
  });

  const workspace = getMockWorkspace("case-empty-template");

  assert.ok(response.data.graph.nodes.length >= 3);
  assert.equal(workspace.graph.metadata.attributes.ingest_mode, "mock-parser");
  assert.equal(workspace.project_id, "case-empty-template");
});

test("mock export preview reflects the current workspace graph", async () => {
  const response = await mockGetExportPreview("case-retail-revenue");

  assert.ok(response.data.chains.length >= 1);
  assert.equal(response.data.project_id, "case-retail-revenue");
});
