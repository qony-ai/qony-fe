import { notFound } from "next/navigation";

import { requireAuthSession } from "@/src/lib/auth/session";
import { ExportPreviewView } from "@/src/features/export-preview/export-preview-view";
import { QonyApiError } from "@/src/lib/api/core";
import { serverApi } from "@/src/lib/api/server";
import type { DeliverableType } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function ExportPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ deliverable_type?: string }>;
}) {
  const { projectId } = await params;
  const { deliverable_type } = await searchParams;
  const session = await requireAuthSession(`/export/preview/${projectId}`);
  const deliverableType = normalizeDeliverableType(deliverable_type);
  let preview;

  try {
    preview = await serverApi.getExportPreview(projectId, deliverableType);
  } catch (error) {
    if (
      error instanceof QonyApiError &&
      (error.status === 404 || error.status === 422)
    ) {
      notFound();
    }
    throw error;
  }

  return <ExportPreviewView initialSession={session} preview={preview} />;
}

function normalizeDeliverableType(value?: string): DeliverableType {
  return value === "business_document" ? "business_document" : "pitch_deck";
}
