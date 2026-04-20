"use client";

import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import type { KnowledgeNodeCreateRequest, KnowledgeRelationType, KnowledgeNodeType } from "@/src/lib/types/api";

import {
  formatKnowledgeLabel,
  knowledgeNodeTypes,
  knowledgeRelationTypes,
} from "./catalog";

export function AddNodeModal({
  isBusy,
  selectedNodeTitle,
  onSubmit,
}: {
  isBusy: boolean;
  selectedNodeTitle: string | null;
  onSubmit: (payload: {
    node: KnowledgeNodeCreateRequest;
    connectToSelected: boolean;
    relationType: KnowledgeRelationType;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<KnowledgeNodeType>("problem");
  const [relationType, setRelationType] = useState<KnowledgeRelationType>("related_to");
  const [connectToSelected, setConnectToSelected] = useState(true);

  async function handleSubmit() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      return;
    }

    await onSubmit({
      connectToSelected,
      node: {
        type,
        title: normalizedTitle,
        description: description.trim() || null,
        source: "user",
      },
      relationType,
    });

    setTitle("");
    setDescription("");
    setType("problem");
    setRelationType("related_to");
  }

  return (
    <div className="rounded-[28px] border border-emerald-200/10 bg-[#0b3128]/94 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
        Add node
      </p>
      <div className="mt-4 grid gap-3">
        <Input
          placeholder="Node title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <select
          className="min-h-12 rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none"
          onChange={(event) => setType(event.target.value as KnowledgeNodeType)}
          value={type}
        >
          {knowledgeNodeTypes.map((item) => (
            <option className="bg-[#08392d]" key={item} value={item}>
              {formatKnowledgeLabel(item)}
            </option>
          ))}
        </select>
        <Textarea
          placeholder="Short description for this node"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <label className="flex items-center gap-3 rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3 text-sm text-white/72">
          <input
            checked={connectToSelected && Boolean(selectedNodeTitle)}
            className="size-4 accent-emerald-300"
            disabled={!selectedNodeTitle}
            onChange={(event) => setConnectToSelected(event.target.checked)}
            type="checkbox"
          />
          {selectedNodeTitle
            ? `Connect from selected node: ${selectedNodeTitle}`
            : "Select a node to create an edge from it"}
        </label>

        <select
          className="min-h-12 rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none"
          disabled={!selectedNodeTitle || !connectToSelected}
          onChange={(event) => setRelationType(event.target.value as KnowledgeRelationType)}
          value={relationType}
        >
          {knowledgeRelationTypes.map((item) => (
            <option className="bg-[#08392d]" key={item} value={item}>
              {formatKnowledgeLabel(item)}
            </option>
          ))}
        </select>

        <Button disabled={isBusy || !title.trim()} onClick={handleSubmit}>
          {isBusy ? "Adding..." : "Add node"}
        </Button>
      </div>
    </div>
  );
}
