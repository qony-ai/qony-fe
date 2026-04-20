"use client";

import type { ExportJobRead } from "@/src/lib/types/api";

export function ExportPreview({
  job,
}: {
  job: ExportJobRead | null;
}) {
  if (!job) {
    return (
      <div className="rounded-[28px] border border-emerald-200/10 bg-white p-5 text-slate-900">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview</p>
        <h3 className="mt-3 text-2xl font-semibold">No export yet</h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Start an export to review the generated slide plan and output URL.
        </p>
      </div>
    );
  }

  const slideCount = Array.isArray(job.slide_plan?.slides)
    ? job.slide_plan.slides.length
    : 0;

  return (
    <div className="rounded-[28px] border border-emerald-200/10 bg-white p-5 text-slate-900">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview</p>
      <h3 className="mt-3 text-2xl font-semibold">{job.export_type}</h3>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Status: {job.status}. Planned slides/pages: {slideCount}.
      </p>
      {job.output_url ? (
        <a className="mt-4 inline-block text-sm font-semibold text-slate-900 underline" href={job.output_url} rel="noreferrer" target="_blank">
          Open generated export
        </a>
      ) : null}
    </div>
  );
}
