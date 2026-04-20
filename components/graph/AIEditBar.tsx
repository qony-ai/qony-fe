"use client";

import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";

export function AIEditBar({
  isBusy,
  lastSummary,
  onSubmit,
}: {
  isBusy: boolean;
  lastSummary: string | null;
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");

  async function handleSubmit() {
    const normalized = prompt.trim();
    if (!normalized) {
      return;
    }

    await onSubmit(normalized);
    setPrompt("");
  }

  return (
    <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
        AI edit
      </p>
      <div className="mt-4 grid gap-3">
        <Textarea
          placeholder="Example: add a risk about supplier concentration and connect it to the core problem."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/56">
            AI edits must go through the backend `AIRouter`.
          </p>
          <Button disabled={isBusy || !prompt.trim()} onClick={handleSubmit}>
            {isBusy ? "Applying..." : "Apply AI edit"}
          </Button>
        </div>
        {lastSummary ? (
          <div className="rounded-[22px] border border-emerald-200/10 bg-[#0d332a]/84 px-4 py-3 text-sm leading-6 text-white/70">
            {lastSummary}
          </div>
        ) : null}
      </div>
    </div>
  );
}
