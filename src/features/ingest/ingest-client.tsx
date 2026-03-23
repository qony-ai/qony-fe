"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, FileText, LoaderCircle, UploadCloud } from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { Textarea } from "@/src/components/ui/textarea";
import { browserApi } from "@/src/lib/api/client";
import type { IngestPayload, ProjectSummary } from "@/src/lib/types/api";
import { truncate } from "@/src/lib/utils";

interface IngestClientProps {
  projects: ProjectSummary[];
  initialProjectId?: string;
}

type IngestStage = "idle" | "uploading" | "parsing" | "complete";

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
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<IngestStage>("idle");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const extractedPreview = result?.graph.nodes.slice(0, 4) ?? [];

  function handleSubmit() {
    setStage(selectedFile ? "uploading" : "parsing");
    startTransition(async () => {
      try {
        if (selectedFile) {
          setStage("uploading");
        }

        const response = selectedFile
          ? await browserApi.ingestProjectFormData(buildIngestFormData({
              file: selectedFile,
              projectId: selectedProjectId,
              rawText,
              replaceExisting,
            }))
          : await browserApi.ingestProject({
              project_id: selectedProjectId,
              raw_text: rawText,
              replace_existing: replaceExisting,
            });

        setStage("complete");
        setResult(response);
        setError(null);
      } catch (requestError) {
        setStage("idle");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to run ingest.",
        );
      }
    });
  }

  return (
    <AppShell
      actions={
        <>
          <Link href={selectedProjectId ? `/project/${selectedProjectId}` : "/dashboard"}>
            <Button variant="secondary">Back to project</Button>
          </Link>
          <Link href={selectedProjectId ? `/workspace/${selectedProjectId}` : "/dashboard"}>
            <Button>Open canvas</Button>
          </Link>
        </>
      }
      description="Upload source material, paste raw context, and seed the graph before you continue the case from the project detail page or canvas."
      eyebrow="Source ingest"
      title="Ingest and extract context"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Choose the target case, then upload supporting material or paste raw context."
              eyebrow="Input"
              title="Seed a project from source material"
            />

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Target project
                </span>
                <select
                  className="min-h-12 rounded-2xl border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none"
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  value={selectedProjectId}
                >
                  {projects.map((project) => (
                    <option className="bg-[#08392d]" key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <div
                className={`rounded-[30px] border border-dashed p-6 transition ${
                  dragActive
                    ? "border-emerald-300/40 bg-emerald-300/8"
                    : "border-emerald-200/12 bg-emerald-300/6"
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  const nextFile = event.dataTransfer.files[0];
                  if (nextFile) {
                    setSelectedFile(nextFile);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-100">
                    <UploadCloud className="size-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-white">
                    Drag and drop a PDF
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/56">
                    Qony will parse the document into a first-pass graph structure.
                    You can also combine a file upload with manual context below.
                  </p>
                  <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/8 px-4 py-2 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/12">
                    <FileText className="size-4" />
                    Choose file
                    <input
                      accept=".pdf,.txt,application/pdf,text/plain"
                      className="hidden"
                      onChange={(event) =>
                        setSelectedFile(event.target.files?.[0] ?? null)
                      }
                      type="file"
                    />
                  </label>
                  {selectedFile ? (
                    <p className="mt-4 text-sm text-white/62">
                      Selected: <span className="font-semibold text-white">{selectedFile.name}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Manual context
                </span>
                <Textarea
                  onChange={(event) => setRawText(event.target.value)}
                  placeholder="Paste the case brief, working notes, or extracted text from your source material."
                  value={rawText}
                />
              </label>

              <label className="flex items-center gap-3 rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3 text-sm text-white/72">
                <input
                  checked={replaceExisting}
                  className="size-4 rounded-sm border border-emerald-200/20 bg-transparent accent-emerald-300"
                  onChange={(event) => setReplaceExisting(event.target.checked)}
                  type="checkbox"
                />
                Replace the current workspace graph for this project
              </label>

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={
                    isPending ||
                    !selectedProjectId ||
                    (!selectedFile && rawText.trim().length < 20)
                  }
                  onClick={handleSubmit}
                >
                  {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Run ingest
                </Button>
                <Link href={selectedProjectId ? `/workspace/${selectedProjectId}` : "/dashboard"}>
                  <Button variant="secondary">Skip to workspace</Button>
                </Link>
              </div>
            </div>
          </Panel>

          {error ? (
            <div className="rounded-[26px] border border-emerald-200/12 bg-emerald-300/8 px-5 py-4 text-sm text-white/78">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Users should always know whether Qony is uploading, parsing, or ready for inspection."
              eyebrow="Progress"
              title="Ingest pipeline status"
            />
            <div className="mt-6 grid gap-3">
              {[
                ["uploading", "Upload source material"],
                ["parsing", "Extract structure and generate graph"],
                ["complete", "Preview extracted context"],
              ].map(([value, label], index) => {
                const isActive =
                  (stage === "uploading" && index === 0) ||
                  (stage === "parsing" && index <= 1) ||
                  stage === "complete";
                return (
                  <div
                    className="flex items-center gap-4 rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3"
                    key={value}
                  >
                    <div className="flex size-9 items-center justify-center rounded-2xl border border-emerald-200/10 bg-emerald-300/6">
                      {isActive ? (
                        stage === "complete" || index < 2 ? (
                          <CheckCircle2 className="size-4 text-emerald-100" />
                        ) : (
                          <LoaderCircle className="size-4 animate-spin text-emerald-100" />
                        )
                      ) : (
                        <span className="font-mono text-[11px] text-white/42">
                          0{index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="mt-1 text-xs text-white/48">
                        {stage === "idle"
                          ? "Waiting for input"
                          : stage === "complete"
                            ? "Complete"
                            : "In progress"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="The right pane previews the first extracted structure before you continue into graph editing."
              eyebrow="Preview"
              title="Extracted context snapshot"
            />
            <div className="mt-6 grid gap-3">
              {selectedProject ? (
                <div className="rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                    Target project
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {selectedProject.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/56">
                    {selectedProject.description}
                  </p>
                </div>
              ) : null}

              {result ? (
                <>
                  <div className="rounded-[22px] border border-emerald-300/16 bg-emerald-300/8 px-4 py-3 text-sm text-emerald-50">
                    Ingest complete: {result.graph.nodes.length} nodes,{" "}
                    {result.graph.edges.length} edges.
                  </div>
                  {extractedPreview.map((node) => (
                    <div
                      className="content-auto rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                      key={node.id}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                        Rank {node.rank}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {node.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/56">
                        {truncate(node.content ?? "No content", 120)}
                      </p>
                    </div>
                  ))}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link href={`/project/${result.job.project_id}`}>
                      <Button className="w-full justify-center" variant="secondary">
                        Back to project
                      </Button>
                    </Link>
                    <Link href={`/workspace/${result.job.project_id}`}>
                      <Button className="w-full justify-center">
                        Open canvas
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-emerald-200/12 bg-emerald-300/5 px-5 py-12 text-center text-sm text-white/60">
                  Run ingest to preview the first extracted nodes and branch framing.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
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
}) {
  const formData = new FormData();
  formData.append("project_id", projectId);
  if (rawText.trim()) {
    formData.append("raw_text", rawText);
  }
  formData.append("replace_existing", String(replaceExisting));
  formData.append("file", file);
  return formData;
}
