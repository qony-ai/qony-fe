import { notFound } from "next/navigation";

import { requireAuthSession } from "@/src/lib/auth/session";
import { ExportPreviewView } from "@/src/features/export-preview/export-preview-view";
import { QonyApiError } from "@/src/lib/api/core";
import { serverApi } from "@/src/lib/api/server";

export const dynamic = "force-dynamic";

export default async function ExportPreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireAuthSession(`/export/preview/${projectId}`);
  let preview;

  try {
    preview = await serverApi.getExportPreview(projectId);
  } catch (error) {
    if (
      error instanceof QonyApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }
    throw error;
  }

  return <ExportPreviewView preview={preview} />;
}
