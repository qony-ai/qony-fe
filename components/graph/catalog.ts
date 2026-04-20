"use client";

import type { KnowledgeNodeType, KnowledgeRelationType, KnowledgeGraphNode } from "@/src/lib/types/api";

export const knowledgeNodeTypes: KnowledgeNodeType[] = [
  "problem",
  "solution",
  "assumption",
  "metric",
  "stakeholder",
  "risk",
  "opportunity",
  "constraint",
  "evidence",
  "market_data",
  "trend",
  "competitor",
  "regulation",
  "objective",
  "resource",
];

export const knowledgeRelationTypes: KnowledgeRelationType[] = [
  "causes",
  "supports",
  "contradicts",
  "requires",
  "affects",
  "related_to",
  "measured_by",
  "mitigated_by",
];

const typeColors: Record<KnowledgeNodeType, string> = {
  problem: "from-rose-300/28 to-rose-400/10 border-rose-200/24 text-rose-50",
  solution: "from-emerald-300/24 to-emerald-400/10 border-emerald-200/24 text-emerald-50",
  assumption: "from-sky-300/22 to-sky-400/10 border-sky-200/24 text-sky-50",
  metric: "from-lime-300/24 to-lime-400/10 border-lime-200/24 text-lime-50",
  stakeholder: "from-cyan-300/24 to-cyan-400/10 border-cyan-200/24 text-cyan-50",
  risk: "from-amber-300/22 to-amber-400/10 border-amber-200/24 text-amber-50",
  opportunity: "from-teal-300/22 to-teal-400/10 border-teal-200/24 text-teal-50",
  constraint: "from-orange-300/22 to-orange-400/10 border-orange-200/24 text-orange-50",
  evidence: "from-violet-300/22 to-violet-400/10 border-violet-200/24 text-violet-50",
  market_data: "from-blue-300/22 to-blue-400/10 border-blue-200/24 text-blue-50",
  trend: "from-indigo-300/22 to-indigo-400/10 border-indigo-200/24 text-indigo-50",
  competitor: "from-fuchsia-300/22 to-fuchsia-400/10 border-fuchsia-200/24 text-fuchsia-50",
  regulation: "from-stone-300/22 to-stone-400/10 border-stone-200/24 text-stone-50",
  objective: "from-green-300/22 to-green-400/10 border-green-200/24 text-green-50",
  resource: "from-yellow-300/22 to-yellow-400/10 border-yellow-200/24 text-yellow-50",
};

export function getNodeTypeClass(type: KnowledgeNodeType) {
  return typeColors[type];
}

export function formatKnowledgeLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function nextNodePosition(nodes: KnowledgeGraphNode[]) {
  const row = Math.floor(nodes.length / 3);
  const column = nodes.length % 3;
  return {
    x: 48 + column * 280,
    y: 48 + row * 220,
  };
}
