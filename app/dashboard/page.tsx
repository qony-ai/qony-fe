import { DashboardClient } from "@/src/features/dashboard/dashboard-client";
import { serverApi } from "@/src/lib/api/server";
import type { ProjectSummary } from "@/src/lib/types/api";

export default async function DashboardPage() {
  let projects: ProjectSummary[] = [];
  let initialError: string | null = null;

  try {
    const response = await serverApi.listProjects();
    projects = response.items;
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Failed to load projects.";
  }

  return <DashboardClient initialProjects={projects} initialError={initialError} />;
}
