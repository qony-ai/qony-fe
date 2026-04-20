"use client";

import type { KnowledgeNodeType } from "@/src/lib/types/api";
import { cn } from "@/src/lib/utils";

import { formatKnowledgeLabel, knowledgeNodeTypes } from "./catalog";

export function NodeTypeFilter({
  hiddenTypes,
  onToggle,
}: {
  hiddenTypes: KnowledgeNodeType[];
  onToggle: (type: KnowledgeNodeType) => void;
}) {
  return (
    <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
        Node type filter
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {knowledgeNodeTypes.map((type) => {
          const active = !hiddenTypes.includes(type);
          return (
            <button
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
                active
                  ? "border-emerald-200/16 bg-emerald-300/12 text-white"
                  : "border-emerald-200/10 bg-transparent text-white/38",
              )}
              key={type}
              onClick={() => onToggle(type)}
              type="button"
            >
              {formatKnowledgeLabel(type)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
