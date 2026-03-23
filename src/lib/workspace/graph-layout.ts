import dagre from "dagre";

import type { GraphEdge, GraphNode, NodeRank, WorkspaceGraph } from "@/src/lib/types/api";

export const graphNodeWidth = 256;
export const graphNodeHeight = 168;
export const graphColumnWidth = 320;
export const graphRowGap = 220;
export const graphSnapSize = 24;
export const graphNodeVerticalGap = 72;

export function getColumnX(rank: NodeRank) {
  return (rank - 1) * graphColumnWidth;
}

export function snapNodePosition(
  rank: NodeRank,
  position: { x: number; y: number },
) {
  return {
    x: getColumnX(rank),
    y: Math.round(position.y / graphSnapSize) * graphSnapSize,
  };
}

export function clampCanvasPosition(position: { x: number; y: number }) {
  return {
    x: Math.round(position.x / graphSnapSize) * graphSnapSize,
    y: Math.round(position.y / graphSnapSize) * graphSnapSize,
  };
}

export function autoLayoutGraph(nodes: GraphNode[], edges: GraphEdge[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    align: "UL",
    nodesep: 48,
    ranksep: 88,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: graphNodeWidth,
      height: graphNodeHeight,
      rank: node.rank,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const preferredByRank = new Map<
    NodeRank,
    Array<{
      branchIndex: number;
      id: string;
      preferredY: number;
      rank: NodeRank;
    }>
  >();

  nodes.forEach((node) => {
    const dagreNode = graph.node(node.id);
    const fallbackY = readBranchIndex(node.metadata.branch_index) * graphRowGap;
    const preferredY = dagreNode
      ? dagreNode.y - graphNodeHeight / 2
      : fallbackY;

    const entries = preferredByRank.get(node.rank) ?? [];
    entries.push({
      branchIndex: readBranchIndex(node.metadata.branch_index),
      id: node.id,
      preferredY,
      rank: node.rank,
    });
    preferredByRank.set(node.rank, entries);
  });

  const layout = new Map<string, { x: number; y: number }>();

  preferredByRank.forEach((entries, rank) => {
    const sortedEntries = entries.toSorted((left, right) => {
      if (left.preferredY !== right.preferredY) {
        return left.preferredY - right.preferredY;
      }
      if (left.branchIndex !== right.branchIndex) {
        return left.branchIndex - right.branchIndex;
      }
      return left.id.localeCompare(right.id);
    });

    let nextAvailableY = 0;

    sortedEntries.forEach((entry) => {
      const resolvedY = Math.max(entry.preferredY, nextAvailableY);
      const snapped = snapNodePosition(rank, {
        x: getColumnX(rank),
        y: resolvedY,
      });

      layout.set(entry.id, snapped);
      nextAvailableY = snapped.y + graphNodeHeight + graphNodeVerticalGap;
    });
  });

  return layout;
}

export function getHighlightedBranch(
  graph: WorkspaceGraph,
  selectedNodeId: string | null,
) {
  if (!selectedNodeId) {
    return {
      nodeIds: new Set<string>(),
      edgeIds: new Set<string>(),
    };
  }

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  graph.edges.forEach((edge) => {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  });

  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  function walk(
    startId: string,
    adjacency: Map<string, string[]>,
    visited: Set<string>,
  ) {
    if (visited.has(startId)) {
      return;
    }

    visited.add(startId);
    nodeIds.add(startId);
    (adjacency.get(startId) ?? []).forEach((nextId) => {
      const matchingEdge = graph.edges.find(
        (edge) =>
          (edge.source === startId && edge.target === nextId) ||
          (edge.target === startId && edge.source === nextId),
      );
      if (matchingEdge) {
        edgeIds.add(matchingEdge.id);
      }
      walk(nextId, adjacency, visited);
    });
  }

  walk(selectedNodeId, outgoing, new Set<string>());
  walk(selectedNodeId, incoming, new Set<string>());

  return { nodeIds, edgeIds };
}

export function getSuggestedChildPosition({
  parent,
  siblings,
  rank,
}: {
  parent: GraphNode | null;
  siblings: GraphNode[];
  rank: NodeRank;
}) {
  if (!parent) {
    return {
      x: getColumnX(rank),
      y: 0,
    };
  }

  const nextY =
    siblings.length > 0
      ? Math.max(...siblings.map((node) => node.position.y)) + graphRowGap
      : parent.position.y;

  return {
    x: getColumnX(rank),
    y: Math.max(0, nextY),
  };
}

export function readBranchIndex(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
