"use client";

import { create } from "zustand";

import type {
  KnowledgeGraph,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeNodeType,
} from "@/src/lib/types/api";

interface GraphStoreState {
  graphId: string | null;
  projectId: string | null;
  metadata: Record<string, unknown>;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  selectedNodeId: string | null;
  hiddenTypes: KnowledgeNodeType[];
  setGraph: (graph: KnowledgeGraph) => void;
  selectNode: (nodeId: string | null) => void;
  setHiddenTypes: (types: KnowledgeNodeType[]) => void;
  upsertNode: (node: KnowledgeGraphNode) => void;
  removeNode: (nodeId: string) => void;
  upsertEdge: (edge: KnowledgeGraphEdge) => void;
  removeEdge: (edgeId: string) => void;
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index === -1) {
    return [...items, nextItem];
  }

  const nextItems = [...items];
  nextItems[index] = nextItem;
  return nextItems;
}

export const useGraphStore = create<GraphStoreState>((set) => ({
  graphId: null,
  projectId: null,
  metadata: {},
  nodes: [],
  edges: [],
  selectedNodeId: null,
  hiddenTypes: [],
  setGraph: (graph) =>
    set({
      graphId: graph.id,
      projectId: graph.project_id,
      metadata: graph.metadata,
      nodes: graph.nodes,
      edges: graph.edges,
      selectedNodeId: graph.nodes[0]?.id ?? null,
    }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setHiddenTypes: (hiddenTypes) => set({ hiddenTypes }),
  upsertNode: (node) =>
    set((state) => ({
      nodes: upsertById(state.nodes, node),
    })),
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    })),
  upsertEdge: (edge) =>
    set((state) => ({
      edges: upsertById(state.edges, edge),
    })),
  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    })),
}));
