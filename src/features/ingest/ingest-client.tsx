"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { browserApi } from "@/src/lib/api/client";
import type { IngestPayload, ProjectSummary } from "@/src/lib/types/api";

interface IngestClientProps {
  projects: ProjectSummary[];
  initialProjectId?: string;
}

export function IngestClient({
  projects,
  initialProjectId,
}: IngestClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjectId ?? projects[0]?.id ?? "",
  );
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [result, setResult] = useState<IngestPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const ingestMode =
    typeof result?.graph.metadata.attributes.ingest_mode === "string"
      ? result.graph.metadata.attributes.ingest_mode
      : null;
  const isStubResult = ingestMode?.startsWith("stub") ?? false;

  function handleSubmit() {
    startTransition(async () => {
      try {
        const response = selectedFile
          ? await browserApi.ingestProjectFormData(buildIngestFormData({
              projectId: selectedProjectId,
              rawText,
              replaceExisting,
              file: selectedFile,
            }))
          : await browserApi.ingestProject({
              project_id: selectedProjectId,
              raw_text: rawText,
              replace_existing: replaceExisting,
            });
        setResult(response);
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to run ingest.",
        );
      }
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Project Ingest</h1>
        <p className="text-sm text-zinc-600">
          Transform raw case input into the initial structured workspace graph.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 p-4">
        <div className="grid gap-3">
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-56 rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Paste raw case text here, or upload a PDF below."
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
          />
          <input
            accept=".pdf,.txt,application/pdf,text/plain"
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
            type="file"
          />
          {selectedFile ? (
            <p className="text-sm text-zinc-600">
              Selected file: <span className="font-medium">{selectedFile.name}</span>
            </p>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={replaceExisting}
              onChange={(event) => setReplaceExisting(event.target.checked)}
              type="checkbox"
            />
            Replace existing workspace graph
          </label>
          <button
            className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={
              isPending ||
              !selectedProjectId ||
              (!selectedFile && rawText.trim().length < 10)
            }
            onClick={handleSubmit}
            type="button"
          >
            Run Ingest
          </button>
        </div>
      </section>

      {selectedProject ? (
        <p className="text-sm text-zinc-600">
          Selected project: <span className="font-medium">{selectedProject.name}</span>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="rounded-xl border border-zinc-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-medium">Latest Result</h2>
            <span className="text-sm text-zinc-600">
              Provider: {result.job.provider}
              {result.job.fallback_used ? " (fallback)" : ""}
            </span>
            <Link
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              href={`/workspace/${result.job.project_id}`}
            >
              Open Workspace
            </Link>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            {result.graph.nodes.length} nodes · {result.graph.edges.length} edges ·{" "}
            {result.graph.metadata.validation.complete_branch_count} complete branches
          </p>
          {isStubResult ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Ingest ini dibentuk oleh deterministic fallback. Kalau kamu mau hasil
              yang lebih terstruktur dari Ollama, ubah backend ke
              `QONY_AI_PROVIDER=ollama`, restart `uvicorn`, lalu ingest ulang
              project ini dengan replace existing aktif.
            </p>
          ) : null}
          <details className="mt-4 rounded-lg border border-zinc-200 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Raw Graph JSON
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
              {JSON.stringify(result.graph, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}
    </main>
  );
}

function buildIngestFormData({
  projectId,
  rawText,
  replaceExisting,
  file,
}: {
  projectId: string;
  rawText: string;
  replaceExisting: boolean;
  file: File;
}): FormData {
  const formData = new FormData();
  formData.append("project_id", projectId);
  if (rawText.trim()) {
    formData.append("raw_text", rawText);
  }
  formData.append("replace_existing", String(replaceExisting));
  formData.append("file", file);
  return formData;
}
