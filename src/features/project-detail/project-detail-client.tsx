"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileUp,
  LayoutPanelTop,
  Save,
  Workflow,
} from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { Textarea } from "@/src/components/ui/textarea";
import { browserApi } from "@/src/lib/api/client";
import type { AuthSession } from "@/src/lib/auth/types";
import type {
  ExportPreviewPayload,
  ProjectDetail,
  ProjectUpdateRequest,
  WorkspacePayload,
} from "@/src/lib/types/api";
import { cn, formatDate, formatRelativeHours } from "@/src/lib/utils";
import { getRankDefinition, orderedRanks } from "@/src/lib/workspace/ranks";

interface ProjectDetailClientProps {
  initialPreview: ExportPreviewPayload | null;
  initialProject: ProjectDetail;
  initialSession?: AuthSession | null;
  initialWorkspace: WorkspacePayload;
}

export function ProjectDetailClient({
  initialPreview,
  initialProject,
  initialSession = null,
  initialWorkspace,
}: ProjectDetailClientProps) {
  const [project, setProject] = useState(initialProject);
  const [draft, setDraft] = useState<ProjectUpdateRequest>({
    description: initialProject.description ?? "",
    name: initialProject.name,
    status: initialProject.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const rankSummary = useMemo(
    () =>
      orderedRanks.map((rank) => {
        const definition = getRankDefinition(rank);
        return {
          ...definition,
          count: initialWorkspace.graph.nodes.filter((node) => node.rank === rank).length,
        };
      }),
    [initialWorkspace.graph.nodes],
  );

  const stats = [
    {
      label: "Project status",
      value: project.status,
      detail: "Change this on the project detail page.",
    },
    {
      label: "Nodes in graph",
      value: String(initialWorkspace.graph.nodes.length),
      detail: `${initialWorkspace.graph.edges.length} edges across the current canvas`,
    },
    {
      label: "Complete branches",
      value: String(initialWorkspace.graph.metadata.validation.complete_branch_count),
      detail: initialWorkspace.graph.metadata.validation.is_valid
        ? "Structure is currently valid."
        : `${initialWorkspace.graph.metadata.validation.issues.length} validation issues need review`,
    },
    {
      label: "Last updated",
      value: formatRelativeHours(project.updated_at),
      detail: formatDate(project.updated_at),
    },
  ];

  function handleSaveProject() {
    startTransition(async () => {
      try {
        const updated = await browserApi.updateProject(project.id, draft);
        setProject(updated);
        setDraft({
          description: updated.description ?? "",
          name: updated.name,
          status: updated.status,
        });
        setSuccess("Project details saved.");
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to update project.",
        );
        setSuccess(null);
      }
    });
  }

  return (
    <AppShell
      actions={
        <>
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
          <Link href={`/project/ingest?projectId=${project.id}`}>
            <Button variant="secondary">
              <FileUp className="size-4" />
              See ingest
            </Button>
          </Link>
          <Link href={`/workspace/${project.id}`}>
            <Button>
              <Workflow className="size-4" />
              Open canvas
            </Button>
          </Link>
        </>
      }
      description={
        project.description ??
        "Use this page to review case details, route into ingest, and continue the graph inside the canvas."
      }
      eyebrow="Project detail"
      initialSession={initialSession}
      title={project.name}
    >
      <div className="grid gap-6">
        {error ? (
          <div className="rounded-[24px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-3 text-sm text-white/78">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-[24px] border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50">
            {success}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Panel className="rounded-[28px] p-5" key={stat.label}>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/46">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">
                {stat.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/54">{stat.detail}</p>
            </Panel>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Keep the case metadata clean here, then move into ingest or the canvas once the framing is ready."
              eyebrow="Case settings"
              title="Project details"
            />

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/44">
                  Project name
                </span>
                <Input
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={draft.name ?? ""}
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/44">
                  Description
                </span>
                <Textarea
                  className="min-h-32"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  value={draft.description ?? ""}
                />
              </label>

              <div className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/44">
                  Status
                </span>
                <div className="flex flex-wrap gap-3">
                  {(["draft", "active", "archived"] as ProjectDetail["status"][]).map(
                    (status) => (
                      <button
                        className={cn(
                          "rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
                          draft.status === status
                            ? "border-emerald-300/28 bg-emerald-300/10 text-emerald-50"
                            : "border-emerald-200/10 bg-emerald-300/6 text-white/60 hover:bg-emerald-300/10 hover:text-white",
                        )}
                        key={status}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            status,
                          }))
                        }
                        type="button"
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  disabled={isPending || (draft.name ?? "").trim().length < 3}
                  onClick={handleSaveProject}
                  variant="secondary"
                >
                  <Save className="size-4" />
                  Save project
                </Button>
                <div className="rounded-full border border-emerald-200/10 bg-emerald-300/6 px-4 py-2 text-sm text-white/62">
                  Owner: {project.user_name}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="This is the main route structure for the case: prepare context, edit the graph, then export the output."
              eyebrow="Case flow"
              title="Next actions"
            />

            <div className="mt-6 grid gap-3">
              <ActionCard
                body="Upload source material or paste raw context to rebuild the graph."
                href={`/project/ingest?projectId=${project.id}`}
                icon={<FileUp className="size-4" />}
                title="See ingest"
              />
              <ActionCard
                body="Open the full canvas editor to move nodes, connect branches, and work with the copilot."
                href={`/workspace/${project.id}`}
                icon={<Workflow className="size-4" />}
                title="Edit graph in canvas"
              />
              <ActionCard
                body="Review narrative output, quality gates, and export the current project as a PDF-ready artifact."
                href={`/export/preview/${project.id}`}
                icon={<LayoutPanelTop className="size-4" />}
                title="Open export preview"
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={initialWorkspace.graph.metadata.validation.is_valid ? "success" : "warning"}>
                  {initialWorkspace.graph.metadata.validation.is_valid ? "Canvas ready" : "Needs review"}
                </Badge>
                {initialPreview ? (
                  <Badge tone={initialPreview.branch_count > 0 ? "success" : "subtle"}>
                    {initialPreview.branch_count} exportable branches
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/58">
                Workspace updated {formatRelativeHours(initialWorkspace.graph.metadata.updated_at)}.
              </p>
              {initialPreview?.warnings.length ? (
                <p className="mt-2 text-sm leading-6 text-lime-50">
                  {initialPreview.warnings[0]}
                </p>
              ) : null}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="This is the current coverage of the structured graph inside the workspace."
              eyebrow="Rank coverage"
              title="Graph distribution"
            />

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rankSummary.map((rank) => (
                <div
                  className="rounded-[24px] border p-4"
                  key={rank.rank}
                  style={{
                    background: rank.surface,
                    borderColor: rank.border,
                  }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                    Rank {rank.rank}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {rank.shortTitle}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                    {rank.count}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {rank.description}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Project-level signals that matter before you present or export."
              eyebrow="Readiness"
              title="Quality summary"
            />

            <div className="mt-6 grid gap-3">
              <div
                className={cn(
                  "rounded-[24px] border p-4",
                  initialWorkspace.graph.metadata.validation.is_valid
                    ? "border-emerald-200/10 bg-emerald-300/6"
                    : "border-lime-300/18 bg-lime-300/10",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-2xl border",
                      initialWorkspace.graph.metadata.validation.is_valid
                        ? "border-emerald-200/10 bg-emerald-300/6"
                        : "border-lime-300/18 bg-lime-300/10",
                    )}
                  >
                    {initialWorkspace.graph.metadata.validation.is_valid ? (
                      <CheckCircle2 className="size-4 text-emerald-100" />
                    ) : (
                      <AlertTriangle className="size-4 text-lime-50" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Graph validation</p>
                    <p className="mt-1 text-sm text-white/54">
                      {initialWorkspace.graph.metadata.validation.is_valid
                        ? "Current graph passes structural validation."
                        : `${initialWorkspace.graph.metadata.validation.issues.length} issue(s) need attention in the canvas.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Workspace owner
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{project.user_email}</p>
              </div>

              {initialPreview?.warnings.length ? (
                initialPreview.warnings.map((warning) => (
                  <div
                    className="rounded-[24px] border border-lime-300/18 bg-lime-300/10 px-4 py-3 text-sm leading-6 text-lime-50"
                    key={warning}
                  >
                    {warning}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-50">
                  No export-blocking warnings are currently surfaced for this project.
                </div>
              )}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}

function ActionCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4 transition hover:bg-emerald-300/10"
      href={href}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex size-10 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-100">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{title}</p>
            <ArrowUpRight className="size-4 text-white/42" />
          </div>
          <p className="mt-2 text-sm leading-6 text-white/54">{body}</p>
        </div>
      </div>
    </Link>
  );
}
