import test from "node:test";
import assert from "node:assert/strict";

import { QonyApiError } from "@/src/lib/api/core";
import {
  getMockWorkspace,
  mockCreateProject,
  mockGetExportPreview,
  mockIngestProject,
  mockListProjects,
  mockMutateWorkspace,
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
  assert.equal(workspace.graph.metadata.validation.is_valid, true);
  assert.equal(
    workspace.graph.metadata.validation.issues.some(
      (issue) => issue.code === "orphan_node",
    ),
    false,
  );
  assert.equal(workspace.project_id, "case-empty-template");
});

test("mock export preview reflects the current workspace graph", async () => {
  const response = await mockGetExportPreview("case-retail-revenue");

  assert.equal(response.data.status, "stub");
  assert.equal(response.data.warnings.length, 0);
  assert.equal(response.data.project_id, "case-retail-revenue");
});

test("mockCreateProject rejects duplicate project slugs instead of overwriting", async () => {
  await mockCreateProject({
    name: "QA Collision",
    description: "First project",
  });

  await assert.rejects(
    () =>
      mockCreateProject({
        name: "QA Collision",
        description: "Second project",
      }),
    (error: unknown) =>
      error instanceof QonyApiError &&
      error.status === 409 &&
      /already exists/i.test(error.message),
  );
});

test("mockIngestProject preserves the current graph when replace_existing is false", async () => {
  const before = getMockWorkspace("case-retail-revenue");

  await mockIngestProject({
    project_id: "case-retail-revenue",
    raw_text:
      "Add fresh material about discount leakage and weak store execution without resetting the current case.",
    replace_existing: false,
  });

  const after = getMockWorkspace("case-retail-revenue");

  assert.equal(after.graph.nodes.length, before.graph.nodes.length + 2);
  assert.equal(after.graph.edges.length, before.graph.edges.length + 2);
  assert.equal(after.graph.nodes.some((node) => node.id === "p1"), true);
  assert.equal(after.graph.metadata.validation.is_valid, true);
});

test("mock export preview warns when graph validation fails", async () => {
  await mockMutateWorkspace({
    project_id: "case-retail-revenue",
    expected_version: 1,
    commands: [
      {
        type: "delete_node",
        node_id: "p1",
      },
    ],
  });

  const workspace = getMockWorkspace("case-retail-revenue");
  const preview = await mockGetExportPreview("case-retail-revenue");

  assert.equal(workspace.graph.metadata.validation.is_valid, false);
  assert.equal(preview.data.status, "stub");
  assert.match(
    preview.data.warnings[0] ?? "",
    /Resolve workspace validation issues before exporting/i,
  );
});

test("mockMutateWorkspace rejects stale expected_version values", async () => {
  await assert.rejects(
    () =>
      mockMutateWorkspace({
        project_id: "case-retail-revenue",
        expected_version: 999,
        commands: [
          {
            type: "move_node",
            node_id: "p1",
            position: { x: 0, y: 0 },
          },
        ],
      }),
    (error: unknown) =>
      error instanceof QonyApiError &&
      error.status === 409 &&
      /version conflict/i.test(error.message),
  );
});
