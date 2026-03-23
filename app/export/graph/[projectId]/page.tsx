import { notFound } from "next/navigation";

import { requireAuthSession } from "@/src/lib/auth/session";
import { GraphExportView } from "@/src/features/export-graph/graph-export-view";
import { QonyApiError } from "@/src/lib/api/core";
import { serverApi } from "@/src/lib/api/server";
import type { ProjectDetail, WorkspacePayload } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function GraphExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const [{ projectId }, { autoprint }] = await Promise.all([params, searchParams]);
  await requireAuthSession(
    autoprint === "1"
      ? `/export/graph/${projectId}?autoprint=1`
      : `/export/graph/${projectId}`,
  );
  let project: ProjectDetail;
  let workspace: WorkspacePayload;

  try {
    [project, workspace] = await Promise.all([
      serverApi.getProject(projectId),
      serverApi.getWorkspace(projectId),
    ]);
  } catch (error) {
    if (
      error instanceof QonyApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <GraphExportView
      autoPrint={autoprint === "1"}
      project={project}
      workspace={workspace}
    />
  );
}
