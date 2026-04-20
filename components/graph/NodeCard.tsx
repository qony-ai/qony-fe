"use client";

import { Badge } from "@/src/components/ui/badge";
import type { KnowledgeGraphNode } from "@/src/lib/types/api";
import { cn, truncate } from "@/src/lib/utils";

import { formatKnowledgeLabel, getNodeTypeClass } from "./catalog";

export function NodeCard({
  node,
  selected,
  onSelect,
}: {
  node: KnowledgeGraphNode;
  selected: boolean;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <button
      className={cn(
        "w-full rounded-[24px] border bg-[linear-gradient(180deg,rgba(10,31,24,0.92),rgba(7,22,18,0.96))] p-4 text-left transition hover:-translate-y-1",
        getNodeTypeClass(node.type),
        selected
          ? "shadow-[0_24px_60px_rgba(0,0,0,0.28)] ring-2 ring-emerald-200/30"
          : "shadow-[0_12px_30px_rgba(0,0,0,0.22)]",
      )}
      onClick={() => onSelect(node.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/46">
            {formatKnowledgeLabel(node.type)}
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">{node.title}</h3>
        </div>
        {node.is_enrichment ? <Badge tone="subtle">Web</Badge> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-white/68">
        {truncate(node.description || "No description provided yet.", 160)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
        <span>{node.source}</span>
        {node.source_url ? <span>source linked</span> : null}
      </div>
    </button>
  );
}
