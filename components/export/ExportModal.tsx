"use client";

import { Button } from "@/src/components/ui/button";
import type { ExportJobRead, ExportType } from "@/src/lib/types/api";

export function ExportModal({
  isBusy,
  lastJob,
  onExport,
}: {
  isBusy: boolean;
  lastJob: ExportJobRead | null;
  onExport: (type: ExportType) => Promise<void>;
}) {
  return (
    <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
        Export
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button disabled={isBusy} onClick={() => onExport("pitch_deck")}>
          {isBusy ? "Exporting..." : "Pitch deck PDF"}
        </Button>
        <Button disabled={isBusy} onClick={() => onExport("business_document")} variant="secondary">
          Business document PDF
        </Button>
      </div>
      {lastJob ? (
        <div className="mt-4 rounded-[22px] border border-emerald-200/10 bg-[#0d332a]/84 px-4 py-3 text-sm leading-6 text-white/70">
          <p>
            Last export: {lastJob.export_type} · {lastJob.status}
          </p>
          {lastJob.output_url ? (
            <a className="mt-2 inline-block text-emerald-100 underline" href={lastJob.output_url} rel="noreferrer" target="_blank">
              Open exported file
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
