import { notFound } from "next/navigation";

import { GraphEditorClient } from "@/components/graph/GraphEditorClient";
import { requireAuthSession } from "@/src/lib/auth/session";
import { QonyApiError } from "@/src/lib/api/core";
import { serverApi } from "@/src/lib/api/server";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ project_id: string }>;
}) {
  const { project_id } = await params;
  const session = await requireAuthSession(`/editor/${project_id}`);
  let project;
  let graph;

  try {
    [project, graph] = await Promise.all([
      serverApi.getProject(project_id),
      serverApi.getProjectGraph(project_id),
    ]);
  } catch (error) {
    if (error instanceof QonyApiError && (error.status === 404 || error.status === 422)) {
      notFound();
    }
    throw error;
  }

  return (
    <GraphEditorClient
      initialGraph={graph}
      initialSession={session}
      project={project}
    />
  );
}
