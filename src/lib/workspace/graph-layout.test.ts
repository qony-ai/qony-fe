import test from "node:test";
import assert from "node:assert/strict";

import type {
  EdgeRelationType,
  GraphEdge,
  GraphNode,
  NodeType,
} from "@/src/lib/types/api";
import {
  autoLayoutGraph,
  clampCanvasPosition,
  getColumnX,
  getHighlightedBranch,
} from "@/src/lib/workspace/graph-layout";

function buildNode(
  id: string,
  type: NodeType,
  branchIndex = 0,
): GraphNode {
  const timestamp = new Date().toISOString();
  return {
    id,
    type,
    title: `${id}-${type}`,
    description: "",
    source: "user",
    is_enrichment: false,
    source_url: null,
    confidence: 1,
    position: { x: 0, y: branchIndex * 200 },
    metadata: { branch_index: branchIndex },
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function buildEdge(
  id: string,
  source: string,
  target: string,
  type: EdgeRelationType = "related_to",
): GraphEdge {
  const timestamp = new Date().toISOString();
  return {
    id,
    type,
    source,
    target,
    label: null,
    metadata: {},
    created_at: timestamp,
    updated_at: timestamp,
  };
}

test("autoLayoutGraph snaps nodes into their type columns", () => {
  const nodes = [
    buildNode("problem", "problem"),
    buildNode("stake", "stakeholder"),
    buildNode("hypothesis", "assumption"),
  ];
  const edges = [
    buildEdge("e1", "problem", "stake"),
    buildEdge("e2", "stake", "hypothesis"),
  ];

  const layout = autoLayoutGraph(nodes, edges);

  assert.equal(layout.get("problem")?.x, getColumnX("problem"));
  assert.equal(layout.get("stake")?.x, getColumnX("stakeholder"));
  assert.equal(layout.get("hypothesis")?.x, getColumnX("assumption"));
});

test("autoLayoutGraph avoids overlap for nodes of the same type", () => {
  const nodes = [
    buildNode("problem", "problem"),
    buildNode("stake-a", "stakeholder", 0),
    buildNode("stake-b", "stakeholder", 1),
    buildNode("stake-c", "stakeholder", 2),
  ];
  const edges = [
    buildEdge("e1", "problem", "stake-a"),
    buildEdge("e2", "problem", "stake-b"),
    buildEdge("e3", "problem", "stake-c"),
  ];

  const layout = autoLayoutGraph(nodes, edges);
  const stakeYs = ["stake-a", "stake-b", "stake-c"]
    .map((id) => layout.get(id)?.y ?? 0)
    .toSorted((left, right) => left - right);

  assert.ok(stakeYs[1] - stakeYs[0] >= 168);
  assert.ok(stakeYs[2] - stakeYs[1] >= 168);
});

test("getHighlightedBranch returns connected ancestors and descendants", () => {
  const graph = {
    nodes: [
      buildNode("problem", "problem"),
      buildNode("stake", "stakeholder"),
      buildNode("hypothesis", "assumption"),
      buildNode("framework", "solution"),
    ],
    edges: [
      buildEdge("e1", "problem", "stake"),
      buildEdge("e2", "stake", "hypothesis"),
      buildEdge("e3", "hypothesis", "framework"),
    ],
    metadata: {
      project_id: "project",
      workspace_id: "workspace",
      version: 1,
      updated_at: new Date().toISOString(),
      validation: {
        complete_branch_count: 0,
        is_valid: true,
        issues: [],
        reachable_node_count: 4,
      },
      attributes: {},
    },
  };

  const highlighted = getHighlightedBranch(graph, "hypothesis");

  assert.deepEqual(
    [...highlighted.nodeIds].toSorted(),
    ["framework", "hypothesis", "problem", "stake"],
  );
  assert.deepEqual([...highlighted.edgeIds].toSorted(), ["e1", "e2", "e3"]);
});

test("clampCanvasPosition preserves free horizontal movement while snapping to grid", () => {
  const snapped = clampCanvasPosition({
    x: 913,
    y: 137,
  });

  assert.deepEqual(snapped, {
    x: 912,
    y: 144,
  });
});
