import { notFound } from "next/navigation";

import { requireAuthSession } from "@/src/lib/auth/session";
import { WorkspaceClient } from "@/src/features/workspace/workspace-client";
import { QonyApiError } from "@/src/lib/api/core";
import { serverApi } from "@/src/lib/api/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireAuthSession(`/workspace/${projectId}`);
  let workspace;

  try {
    workspace = await serverApi.getWorkspace(projectId);
  } catch (error) {
    if (
      error instanceof QonyApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }
    throw error;
  }

  return <WorkspaceClient initialWorkspace={workspace} />;
}
