import dagre from "dagre";

import type {
  GraphEdge,
  GraphNode,
  NodeType,
  WorkspaceGraph,
} from "@/src/lib/types/api";
import { orderedRanks } from "@/src/lib/workspace/ranks";

export const graphNodeWidth = 256;
export const graphNodeHeight = 168;
export const graphColumnWidth = 320;
export const graphRowGap = 220;
export const graphSnapSize = 24;
export const graphNodeVerticalGap = 72;

const columnIndexByType = new Map<NodeType, number>(
  orderedRanks.map((type, index) => [type, index]),
);

export function getColumnX(type: NodeType) {
  const index = columnIndexByType.get(type) ?? 0;
  return index * graphColumnWidth;
}

export function snapNodePosition(
  type: NodeType,
  position: { x: number; y: number },
) {
  return {
    x: getColumnX(type),
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
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const preferredByType = new Map<
    NodeType,
    Array<{
      branchIndex: number;
      id: string;
      preferredY: number;
      type: NodeType;
    }>
  >();

  nodes.forEach((node) => {
    const dagreNode = graph.node(node.id);
    const fallbackY = readBranchIndex(node.metadata.branch_index) * graphRowGap;
    const preferredY = dagreNode
      ? dagreNode.y - graphNodeHeight / 2
      : fallbackY;

    const entries = preferredByType.get(node.type) ?? [];
    entries.push({
      branchIndex: readBranchIndex(node.metadata.branch_index),
      id: node.id,
      preferredY,
      type: node.type,
    });
    preferredByType.set(node.type, entries);
  });

  const layout = new Map<string, { x: number; y: number }>();

  preferredByType.forEach((entries, type) => {
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
      const snapped = snapNodePosition(type, {
        x: getColumnX(type),
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
  type,
}: {
  parent: GraphNode | null;
  siblings: GraphNode[];
  type: NodeType;
}) {
  if (!parent) {
    return {
      x: getColumnX(type),
      y: 0,
    };
  }

  const nextY =
    siblings.length > 0
      ? Math.max(...siblings.map((node) => node.position.y)) + graphRowGap
      : parent.position.y;

  return {
    x: getColumnX(type),
    y: Math.max(0, nextY),
  };
}

export function readBranchIndex(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
