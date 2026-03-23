import { requireAuthSession } from "@/src/lib/auth/session";
import { IngestClient } from "@/src/features/ingest/ingest-client";
import { serverApi } from "@/src/lib/api/server";

export const dynamic = "force-dynamic";

export default async function IngestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const params = await searchParams;
  await requireAuthSession(
    params.projectId ? `/project/ingest?projectId=${params.projectId}` : "/project/ingest",
  );
  const response = await serverApi.listProjects();
  return <IngestClient initialProjectId={params.projectId} projects={response.items} />;
}
