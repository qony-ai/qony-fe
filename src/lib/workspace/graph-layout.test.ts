import test from "node:test";
import assert from "node:assert/strict";

import type { GraphEdge, GraphNode } from "@/src/lib/types/api";
import {
  autoLayoutGraph,
  getColumnX,
  getHighlightedBranch,
} from "@/src/lib/workspace/graph-layout";

function buildNode(
  id: string,
  rank: GraphNode["rank"],
  branchIndex = 0,
): GraphNode {
  const timestamp = new Date().toISOString();
  return {
    id,
    rank,
    kind: `rank-${rank}`,
    title: `${id}-${rank}`,
    content: "",
    source: "manual",
    position: { x: 0, y: branchIndex * 200 },
    metadata: { branch_index: branchIndex },
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function buildEdge(id: string, source: string, target: string): GraphEdge {
  const timestamp = new Date().toISOString();
  return {
    id,
    source,
    target,
    label: null,
    metadata: {},
    created_at: timestamp,
    updated_at: timestamp,
  };
}

test("autoLayoutGraph snaps nodes into their rank columns", () => {
  const nodes = [
    buildNode("problem", 1),
    buildNode("sub", 2),
    buildNode("hypothesis", 3),
  ];
  const edges = [
    buildEdge("e1", "problem", "sub"),
    buildEdge("e2", "sub", "hypothesis"),
  ];

  const layout = autoLayoutGraph(nodes, edges);

  assert.equal(layout.get("problem")?.x, getColumnX(1));
  assert.equal(layout.get("sub")?.x, getColumnX(2));
  assert.equal(layout.get("hypothesis")?.x, getColumnX(3));
});

test("autoLayoutGraph avoids overlap for nodes in the same rank", () => {
  const nodes = [
    buildNode("problem", 1),
    buildNode("sub-a", 2, 0),
    buildNode("sub-b", 2, 1),
    buildNode("sub-c", 2, 2),
  ];
  const edges = [
    buildEdge("e1", "problem", "sub-a"),
    buildEdge("e2", "problem", "sub-b"),
    buildEdge("e3", "problem", "sub-c"),
  ];

  const layout = autoLayoutGraph(nodes, edges);
  const rank2Ys = ["sub-a", "sub-b", "sub-c"]
    .map((id) => layout.get(id)?.y ?? 0)
    .toSorted((left, right) => left - right);

  assert.ok(rank2Ys[1] - rank2Ys[0] >= 168);
  assert.ok(rank2Ys[2] - rank2Ys[1] >= 168);
});

test("getHighlightedBranch returns connected ancestors and descendants", () => {
  const graph = {
    nodes: [
      buildNode("problem", 1),
      buildNode("sub", 2),
      buildNode("hypothesis", 3),
      buildNode("framework", 4),
    ],
    edges: [
      buildEdge("e1", "problem", "sub"),
      buildEdge("e2", "sub", "hypothesis"),
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
    ["framework", "hypothesis", "problem", "sub"],
  );
  assert.deepEqual([...highlighted.edgeIds].toSorted(), ["e1", "e2", "e3"]);
});
