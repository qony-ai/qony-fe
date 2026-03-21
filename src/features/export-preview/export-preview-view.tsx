import Link from "next/link";

import type { ExportPreviewPayload } from "@/src/lib/types/api";

interface ExportPreviewViewProps {
  preview: ExportPreviewPayload;
}

export function ExportPreviewView({ preview }: ExportPreviewViewProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Export Preview</h1>
          <p className="text-sm text-zinc-600">
            Snapshot {preview.snapshot_id} · {preview.branch_count} complete branches · generated {preview.generated_at}
          </p>
        </div>
        <Link
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          href={`/workspace/${preview.project_id}`}
        >
          Back to Workspace
        </Link>
      </header>

      {preview.narrative ? (
        <section className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-medium">Narrative</h2>
          <p className="mt-3 text-sm whitespace-pre-wrap text-zinc-700">
            {preview.narrative}
          </p>
        </section>
      ) : null}

      {preview.warnings.length > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {preview.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4">
        {preview.chains.map((chain) => (
          <article key={chain.chain_id} className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-lg font-medium">{chain.chain_id}</h2>
            <ol className="mt-4 grid gap-3">
              {chain.steps.map((step) => (
                <li key={step.node_id} className="rounded-lg border border-zinc-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Rank {step.rank} · {step.kind}
                  </p>
                  <p className="mt-1 font-medium">{step.title}</p>
                  {step.content ? (
                    <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-700">
                      {step.content}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </main>
  );
}
