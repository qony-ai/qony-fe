"use client";

import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import type { KnowledgeGraphNode, KnowledgeNodeType, KnowledgeNodeSource } from "@/src/lib/types/api";

import { formatKnowledgeLabel, knowledgeNodeTypes } from "./catalog";

type NodeDraft = {
  title: string;
  description: string;
  type: KnowledgeNodeType;
  source: KnowledgeNodeSource;
  sourceUrl: string;
};

function toDraft(node: KnowledgeGraphNode): NodeDraft {
  return {
    title: node.title,
    description: node.description || "",
    type: node.type,
    source: node.source,
    sourceUrl: node.source_url || "",
  };
}

export function NodeSidebar({
  isBusy,
  node,
  onDelete,
  onSave,
}: {
  isBusy: boolean;
  node: KnowledgeGraphNode | null;
  onDelete: () => Promise<void>;
  onSave: (draft: {
    title: string;
    description: string | null;
    type: KnowledgeNodeType;
    source: KnowledgeNodeSource;
    source_url: string | null;
  }) => Promise<void>;
}) {
  if (!node) {
    return (
      <aside className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
          Node details
        </p>
        <p className="mt-4 text-sm leading-6 text-white/58">
          Select a node on the canvas to edit its title, description, type, and source metadata.
        </p>
      </aside>
    );
  }

  return (
    <NodeSidebarForm
      isBusy={isBusy}
      key={`${node.id}:${node.updated_at}`}
      node={node}
      onDelete={onDelete}
      onSave={onSave}
    />
  );
}

function NodeSidebarForm({
  isBusy,
  node,
  onDelete,
  onSave,
}: {
  isBusy: boolean;
  node: KnowledgeGraphNode;
  onDelete: () => Promise<void>;
  onSave: (draft: {
    title: string;
    description: string | null;
    type: KnowledgeNodeType;
    source: KnowledgeNodeSource;
    source_url: string | null;
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<NodeDraft>(() => toDraft(node));

  return (
    <aside className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
        Node details
      </p>
      <div className="mt-4 grid gap-3">
        <Input
          placeholder="Node title"
          value={draft.title}
          onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value } : current)}
        />
        <select
          className="min-h-12 rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none"
          onChange={(event) =>
            setDraft((current) =>
              current ? { ...current, type: event.target.value as KnowledgeNodeType } : current,
            )
          }
          value={draft.type}
        >
          {knowledgeNodeTypes.map((item) => (
            <option className="bg-[#08392d]" key={item} value={item}>
              {formatKnowledgeLabel(item)}
            </option>
          ))}
        </select>
        <select
          className="min-h-12 rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none"
          onChange={(event) =>
            setDraft((current) =>
              current ? { ...current, source: event.target.value as KnowledgeNodeSource } : current,
            )
          }
          value={draft.source}
        >
          {(["document", "web", "user"] as KnowledgeNodeSource[]).map((item) => (
            <option className="bg-[#08392d]" key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Input
          placeholder="Source URL if this node comes from the web"
          value={draft.sourceUrl}
          onChange={(event) =>
            setDraft((current) => current ? { ...current, sourceUrl: event.target.value } : current)
          }
        />
        <Textarea
          placeholder="Node description"
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => current ? { ...current, description: event.target.value } : current)
          }
        />
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={isBusy || !draft.title.trim()}
            onClick={() =>
              onSave({
                title: draft.title.trim(),
                description: draft.description.trim() || null,
                type: draft.type,
                source: draft.source,
                source_url: draft.sourceUrl.trim() || null,
              })
            }
          >
            {isBusy ? "Saving..." : "Save node"}
          </Button>
          <Button disabled={isBusy} onClick={onDelete} variant="danger">
            Delete node
          </Button>
        </div>
      </div>
    </aside>
  );
}
