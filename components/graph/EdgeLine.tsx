"use client";

import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/src/lib/types/api";

import { formatKnowledgeLabel } from "./catalog";

function findNodeTitle(nodes: KnowledgeGraphNode[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId)?.title ?? nodeId;
}

export function EdgeLine({
  edge,
  nodes,
}: {
  edge: KnowledgeGraphEdge;
  nodes: KnowledgeGraphNode[];
}) {
  return (
    <div className="rounded-[20px] border border-emerald-200/10 bg-[#0c2f26]/84 px-4 py-3 text-sm text-white/70">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/36">
        {formatKnowledgeLabel(edge.relation_type)}
      </p>
      <p className="mt-2 leading-6 text-white/74">
        {findNodeTitle(nodes, edge.source)}
        {" -> "}
        {findNodeTitle(nodes, edge.target)}
      </p>
    </div>
  );
}
