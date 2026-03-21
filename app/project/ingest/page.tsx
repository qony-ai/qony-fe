import { IngestClient } from "@/src/features/ingest/ingest-client";
import { serverApi } from "@/src/lib/api/server";
import type { ProjectSummary } from "@/src/lib/types/api";

export default async function IngestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const params = await searchParams;
  let projects: ProjectSummary[] = [];
  let errorMessage: string | null = null;

  try {
    const response = await serverApi.listProjects();
    projects = response.items;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load projects.";
  }

  if (errorMessage) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
        <h1 className="text-3xl font-semibold">Project Ingest</h1>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      </main>
    );
  }

  return <IngestClient initialProjectId={params.projectId} projects={projects} />;
}
