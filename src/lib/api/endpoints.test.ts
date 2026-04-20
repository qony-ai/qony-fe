import test from "node:test";
import assert from "node:assert/strict";

import { apiEndpoints } from "@/src/lib/api/endpoints";

test("apiEndpoints expose the PRD graph surface", () => {
  assert.equal(apiEndpoints.projectGraph("project-1"), "/api/qony/projects/project-1/graph");
  assert.equal(apiEndpoints.projectIngest("project-1"), "/api/qony/projects/project-1/ingest");
  assert.equal(apiEndpoints.graph("graph-1"), "/api/qony/graphs/graph-1");
  assert.equal(apiEndpoints.graphAiEdit("graph-1"), "/api/qony/graphs/graph-1/ai-edit");
  assert.equal(apiEndpoints.graphExport("graph-1"), "/api/qony/graphs/graph-1/export");
  assert.equal(apiEndpoints.exportJob("job-1"), "/api/qony/exports/job-1");
});
