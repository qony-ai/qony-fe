"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ProgressOverlay } from "@/components/ingestion/ProgressOverlay";
import { UploadZone } from "@/components/ingestion/UploadZone";
import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { api } from "@/lib/api";
import type { AuthSession } from "@/src/lib/auth/types";
import type { ProjectSummary } from "@/src/lib/types/api";

function backendWebSocketUrl(jobId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  return `${baseUrl.replace(/\/$/, "").replace(/^http/, "ws")}/api/v1/ws/ingest/${jobId}`;
}

interface IngestClientProps {
  projects: ProjectSummary[];
  initialProjectId?: string;
  initialSession?: AuthSession | null;
}

export function IngestClient({
  projects,
  initialProjectId,
  initialSession = null,
}: IngestClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? projects[0]?.id ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedProjectId, setCompletedProjectId] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  async function handleUpload() {
    if (!selectedProjectId || !selectedFile) {
      return;
    }

    setIsUploading(true);
    setProgress({ step: "uploading_file", pct: 5 });
    setError(null);
    setCompletedProjectId(null);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      const job = await api.ingestProjectFile(selectedProjectId, formData);

      await new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(backendWebSocketUrl(job.id));

        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data) as {
            event?: string;
            step?: string;
            pct?: number;
          };

          if (payload.event === "progress" && payload.step && typeof payload.pct === "number") {
            setProgress({ step: payload.step, pct: payload.pct });
          }

          if (payload.event === "complete") {
            socket.close();
            resolve();
          }

          if (payload.event === "failed") {
            socket.close();
            reject(new Error("Ingestion failed."));
          }
        };

        socket.onerror = () => reject(new Error("Unable to connect to the ingestion progress socket."));
      });

      setProgress({ step: "complete", pct: 100 });
      setCompletedProjectId(selectedProjectId);
      setSelectedFile(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to run ingestion.",
      );
      setProgress(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
          {completedProjectId ? (
            <Link href={`/editor/${completedProjectId}`}>
              <Button>Open editor</Button>
            </Link>
          ) : null}
        </div>
      }
      description="Upload a business case document to start parsing, business context detection, typed node extraction, and web enrichment in parallel."
      eyebrow="Ingestion"
      initialSession={initialSession}
      title="Document ingestion"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <div className="rounded-[30px] border border-emerald-200/10 bg-emerald-300/6 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
              Target project
            </p>
            <select
              className="mt-4 min-h-12 w-full rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none"
              onChange={(event) => setSelectedProjectId(event.target.value)}
              value={selectedProjectId}
            >
              {projects.map((project) => (
                <option className="bg-[#08392d]" key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {selectedProject ? (
              <p className="mt-3 text-sm leading-6 text-white/58">
                {selectedProject.description || "No description yet."}
              </p>
            ) : null}
          </div>

          <UploadZone
            file={selectedFile}
            isBusy={isUploading}
            onPickFile={setSelectedFile}
            onSubmit={handleUpload}
          />

          {error ? (
            <div className="rounded-[24px] border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6">
          {progress ? <ProgressOverlay pct={progress.pct} step={progress.step} /> : null}

          <div className="rounded-[30px] border border-emerald-200/10 bg-emerald-300/6 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
              Pipeline
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-white/62">
              <p>1. Parse document content into plain text.</p>
              <p>2. Detect business context.</p>
              <p>3. Run node extraction and internet scraping in parallel.</p>
              <p>4. Build the flat typed knowledge graph.</p>
            </div>
          </div>

          {completedProjectId ? (
            <div className="rounded-[30px] border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(134,255,138,0.12),rgba(46,230,191,0.08))] p-5">
              <p className="text-lg font-semibold text-white">Ingestion complete</p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                The graph is ready to review in the editor.
              </p>
              <Link className="mt-4 inline-block" href={`/editor/${completedProjectId}`}>
                <Button>Open project editor</Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
