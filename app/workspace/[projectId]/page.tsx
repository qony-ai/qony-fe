import { WorkspaceClient } from "@/src/features/workspace/workspace-client";
import { serverApi } from "@/src/lib/api/server";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  let workspace = null;
  let errorMessage: string | null = null;

  try {
    workspace = await serverApi.getWorkspace(projectId);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load workspace.";
  }

  if (!workspace || errorMessage) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
        <h1 className="text-3xl font-semibold">Workspace</h1>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage ?? "Failed to load workspace."}
        </p>
      </main>
    );
  }

  return <WorkspaceClient initialWorkspace={workspace} />;
}
