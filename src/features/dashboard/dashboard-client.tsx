"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Clock3,
  FolderKanban,
  FolderPlus,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { browserApi } from "@/src/lib/api/client";
import type { AuthSession } from "@/src/lib/auth/types";
import type { ProjectSummary } from "@/src/lib/types/api";
import { cn, formatDate, formatRelativeHours } from "@/src/lib/utils";

interface DashboardClientProps {
  initialProjects: ProjectSummary[];
  initialSession?: AuthSession | null;
}

type SortKey = "recent" | "name" | "status";

export function pickDashboardPrimaryProject(projects: ProjectSummary[]) {
  return projects[0] ?? null;
}

export function DashboardClient({
  initialProjects,
  initialSession = null,
}: DashboardClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deferredQuery = useDeferredValue(query);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const nextProjects = projects.filter((project) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        project.name,
        project.description ?? "",
        project.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return nextProjects.toSorted((left, right) => {
      if (sortKey === "name") {
        return left.name.localeCompare(right.name);
      }
      if (sortKey === "status") {
        return left.status.localeCompare(right.status);
      }
      return right.updated_at.localeCompare(left.updated_at);
    });
  }, [deferredQuery, projects, sortKey]);

  const stats = useMemo(
    () => [
      {
        label: "Open cases",
        value: projects.filter((project) => project.status !== "archived").length,
      },
      {
        label: "Active graphs",
        value: projects.filter((project) => project.status === "active").length,
      },
      {
        label: "Drafts awaiting structure",
        value: projects.filter((project) => project.status === "draft").length,
      },
    ],
    [projects],
  );
  const primaryProject = pickDashboardPrimaryProject(filteredProjects);
  const primaryProjectId = primaryProject?.id ?? null;
  const primaryProjectName = primaryProject?.name ?? "visible case";

  function handleDeleteProject(project: ProjectSummary) {
    const shouldDelete = window.confirm(
      `Delete "${project.name}"? This removes the project, graph, and export state.`,
    );

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      try {
        await browserApi.deleteProject(project.id);
        setProjects((current) =>
          current.filter((currentProject) => currentProject.id !== project.id),
        );
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to delete project.",
        );
      }
    });
  }

  return (
    <AppShell
      actions={
        <Link href="/project/new">
          <Button>
            <FolderPlus className="size-4" />
            Create project
          </Button>
        </Link>
      }
      description="Lihat semua project, upload business case, lalu lanjutkan ke editor typed-graph dan export."
      eyebrow="Project hub"
      initialSession={initialSession}
      title="Project dashboard"
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Panel className="rounded-[28px] p-5" key={stat.label}>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/46">
                {stat.label}
              </p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">
                {stat.value}
              </p>
            </Panel>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Project baru sekarang memakai flow sederhana: isi nama dan detail, lalu lanjut otomatis ke ingest."
              eyebrow="New case"
              title="Create then ingest"
            />
            <div className="mt-6 rounded-[26px] border border-emerald-200/12 bg-[linear-gradient(135deg,rgba(134,255,138,0.1),rgba(46,230,191,0.06))] p-5">
              <p className="text-lg font-semibold text-white">
                Create project with only two fields first
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Nama project dan detail singkat sudah cukup untuk buka case baru. Setelah itu
                Qony langsung bawa kamu ke ingest supaya source material bisa dimasukkan dulu.
              </p>
              <div className="mt-5">
                <Link href="/project/new">
                  <Button>
                    <FolderPlus className="size-4" />
                    Start new project flow
                  </Button>
                </Link>
              </div>
            </div>
          </Panel>

          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Flow aktif sekarang hanya memakai ingestion dan editor typed-graph sesuai PRD."
              eyebrow="Continue work"
              title="Open the current case"
            />
            <div className="mt-6 grid gap-3">
              <QuickLink
                href={
                  primaryProjectId
                    ? `/project/ingest?projectId=${primaryProjectId}`
                    : "/project/ingest"
                }
                icon={Sparkles}
                subtitle={
                  primaryProjectId
                    ? `Upload the next business case into ${primaryProjectName} before continuing to the editor.`
                    : "No visible project is selected yet. Clear filters or create a new case."
                }
                title="Start ingestion"
              />
              <QuickLink
                href={primaryProjectId ? `/editor/${primaryProjectId}` : "/dashboard"}
                icon={Workflow}
                subtitle="Open the PRD editor if the graph already exists."
                title="Open editor"
              />
              <QuickLink
                href={
                  primaryProjectId
                    ? `/project/ingest?projectId=${primaryProjectId}`
                    : "/project/ingest"
                }
                icon={FolderKanban}
                subtitle="Upload a PDF, DOCX, PPTX, or TXT file and stream progress over WebSocket."
                title="Document ingestion"
              />
            </div>
          </Panel>
        </section>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            action={
              <div className="flex flex-wrap gap-2">
                {(["recent", "name", "status"] as SortKey[]).map((value) => (
                  <button
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition",
                      sortKey === value
                        ? "border-emerald-300/28 bg-emerald-300/10 text-emerald-50"
                        : "border-emerald-200/10 bg-emerald-300/6 text-white/62 hover:bg-emerald-300/10 hover:text-white",
                    )}
                    key={value}
                    onClick={() => setSortKey(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            }
            description="Search, sort, and open the project that needs attention next."
            eyebrow="Project list"
            title="Active analysis cases"
          />

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/34" />
              <Input
                className="pl-10"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cases, descriptions, or status"
                value={query}
              />
            </div>
            <Badge tone="subtle">{filteredProjects.length} visible</Badge>
          </div>

          {error ? (
            <div className="mt-6 rounded-[22px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-3 text-sm text-white/78">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredProjects.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-emerald-200/12 bg-emerald-300/5 px-5 py-14 text-center text-sm text-white/60 xl:col-span-2">
                No cases match the current filter. Create a new case or clear the
                search query.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard
                  disabled={isPending}
                  key={project.id}
                  onDelete={handleDeleteProject}
                  project={project}
                />
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function ProjectCard({
  project,
  disabled,
  onDelete,
}: {
  project: ProjectSummary;
  disabled: boolean;
  onDelete: (project: ProjectSummary) => void;
}) {
  return (
    <article className="content-auto glass-panel rounded-[28px] border border-emerald-200/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Badge
            tone={
              project.status === "active"
                ? "success"
                : project.status === "draft"
                  ? "subtle"
                  : "warning"
            }
          >
            {project.status}
          </Badge>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
            {project.name}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/56">
            {project.description || "No description yet."}
          </p>
        </div>
        <div className="rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3 text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40">
            Last updated
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatRelativeHours(project.updated_at)}
          </p>
          <p className="mt-1 text-xs text-white/46">{formatDate(project.updated_at)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/6 px-3 py-1.5 text-xs text-white/60">
          <Clock3 className="size-3.5" />
          {formatRelativeHours(project.updated_at)}
        </div>
        {project.metadata.source ? (
          <div className="rounded-full border border-emerald-200/10 bg-emerald-300/6 px-3 py-1.5 text-xs text-white/60">
            {String(project.metadata.source)}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ProjectRouteLink href={`/editor/${project.id}`} label="Open editor" />
        <ProjectRouteLink href={`/project/ingest?projectId=${project.id}`} label="Ingest" />
        <ProjectRouteLink href="/pricing?checkout=pro" label="Upgrade" />
        <ProjectRouteLink href="/billing" label="Billing" />
        <Button
          className="sm:col-span-2"
          disabled={disabled}
          onClick={() => onDelete(project)}
          variant="danger"
        >
          Delete project
        </Button>
      </div>
    </article>
  );
}

function ProjectRouteLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-between gap-2 rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3 text-sm font-semibold text-white/76 transition hover:bg-emerald-300/10 hover:text-white"
      href={href}
    >
      <span>{label}</span>
      <ArrowUpRight className="size-4" />
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4 transition hover:bg-emerald-300/10"
      href={href}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex size-10 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-100">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-white/54">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
