"use client";

import { FileUp } from "lucide-react";

import { Button } from "@/src/components/ui/button";

export function UploadZone({
  file,
  isBusy,
  onPickFile,
  onSubmit,
}: {
  file: File | null;
  isBusy: boolean;
  onPickFile: (file: File | null) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-emerald-200/16 bg-emerald-300/6 px-5 py-8 text-center text-sm text-white/60">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-100">
          <FileUp className="size-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-white">
          Upload a PDF, DOCX, PPTX, or TXT business case
        </p>
        <p className="mt-3 leading-6 text-white/56">
          Qony will parse the document, detect business context, extract typed nodes, and run web enrichment in parallel.
        </p>
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/8 px-4 py-2 font-semibold text-white transition hover:bg-emerald-300/12">
          Choose file
          <input
            accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
            className="hidden"
            onChange={(event) => onPickFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        {file ? (
          <p className="mt-4 text-sm text-white/68">
            Selected: <span className="font-semibold text-white">{file.name}</span>
          </p>
        ) : null}
        <Button className="mt-5" disabled={isBusy || !file} onClick={() => void onSubmit()}>
          {isBusy ? "Uploading..." : "Start ingestion"}
        </Button>
      </div>
    </div>
  );
}
