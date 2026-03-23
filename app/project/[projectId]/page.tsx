import { requireAuthSession } from "@/src/lib/auth/session";
import { notFound } from "next/navigation";

import { ProjectDetailClient } from "@/src/features/project-detail/project-detail-client";
import { QonyApiError } from "@/src/lib/api/core";
import { serverApi } from "@/src/lib/api/server";
import type {
  ExportPreviewPayload,
  ProjectDetail,
  WorkspacePayload,
} from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireAuthSession(`/project/${projectId}`);
  let project: ProjectDetail;
  let workspace: WorkspacePayload;
  let preview: ExportPreviewPayload | null = null;

  try {
    [project, workspace, preview] = await Promise.all([
      serverApi.getProject(projectId),
      serverApi.getWorkspace(projectId),
      serverApi.getExportPreview(projectId).catch((error) => {
        if (
          error instanceof QonyApiError &&
          (error.status === 404 || error.status === 422)
        ) {
          return null;
        }

        throw error;
      }),
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
    <ProjectDetailClient
      initialPreview={preview}
      initialProject={project}
      initialSession={session}
      initialWorkspace={workspace}
    />
  );
}
