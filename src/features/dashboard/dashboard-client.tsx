"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { browserApi } from "@/src/lib/api/client";
import type {
  ProjectCreateRequest,
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateRequest,
} from "@/src/lib/types/api";

interface DashboardClientProps {
  initialProjects: ProjectSummary[];
  initialError?: string | null;
}

export function DashboardClient({
  initialProjects,
  initialError = null,
}: DashboardClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();
  const [createForm, setCreateForm] = useState<ProjectCreateRequest>({
    name: "",
    description: "",
    metadata: {},
  });

  function handleCreate() {
    startTransition(async () => {
      try {
        const created = await browserApi.createProject(createForm);
        setProjects((current) => [created, ...current]);
        setCreateForm({ name: "", description: "", metadata: {} });
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to create project.",
        );
      }
    });
  }

  function handleUpdate(projectId: string, payload: ProjectUpdateRequest) {
    startTransition(async () => {
      try {
        const updated = await browserApi.updateProject(projectId, payload);
        setProjects((current) =>
          current.map((project) => (project.id === updated.id ? updated : project)),
        );
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to update project.",
        );
      }
    });
  }

  function handleDelete(projectId: string) {
    startTransition(async () => {
      try {
        await browserApi.deleteProject(projectId);
        setProjects((current) =>
          current.filter((project) => project.id !== projectId),
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-600">
          Create and manage structured problem-solving projects.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="text-lg font-medium">Create Project</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Project name"
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Short description"
            value={createForm.description ?? ""}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <button
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={isPending || !createForm.name.trim()}
            onClick={handleCreate}
            type="button"
          >
            Create
          </button>
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
            No projects yet.
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              disabled={isPending}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </section>
    </main>
  );
}

function ProjectCard({
  project,
  disabled,
  onDelete,
  onUpdate,
}: {
  project: ProjectSummary;
  disabled: boolean;
  onDelete: (projectId: string) => void;
  onUpdate: (projectId: string, payload: ProjectUpdateRequest) => void;
}) {
  const [draft, setDraft] = useState<ProjectUpdateRequest>({
    name: project.name,
    description: project.description ?? "",
    status: project.status,
  });

  return (
    <article className="rounded-xl border border-zinc-200 p-4">
      <div className="grid gap-3 md:grid-cols-[2fr_3fr_1fr]">
        <input
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={draft.name ?? ""}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
        />
        <input
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={draft.description ?? ""}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={draft.status ?? project.status}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              status: event.target.value as ProjectDetail["status"],
            }))
          }
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <button
          className="rounded-md border border-zinc-300 px-3 py-2"
          disabled={disabled}
          onClick={() => onUpdate(project.id, draft)}
          type="button"
        >
          Save
        </button>
        <button
          className="rounded-md border border-red-300 px-3 py-2 text-red-700"
          disabled={disabled}
          onClick={() => onDelete(project.id)}
          type="button"
        >
          Delete
        </button>
        <Link
          className="rounded-md border border-zinc-300 px-3 py-2"
          href={`/project/ingest?projectId=${project.id}`}
        >
          Ingest
        </Link>
        <Link
          className="rounded-md border border-zinc-300 px-3 py-2"
          href={`/workspace/${project.id}`}
        >
          Workspace
        </Link>
        <Link
          className="rounded-md border border-zinc-300 px-3 py-2"
          href={`/export/preview/${project.id}`}
        >
          Export Preview
        </Link>
      </div>
    </article>
  );
}

