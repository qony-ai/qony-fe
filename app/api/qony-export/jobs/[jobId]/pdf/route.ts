import { type NextRequest, NextResponse } from "next/server";

import { getAuthSessionFromHeaders } from "@/src/lib/auth/session";
import { buildInternalActorToken } from "@/src/lib/auth/internal-actor";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "authentication_required",
          message: "Please sign in to continue.",
        },
      },
      { status: 401 },
    );
  }

  const internalActorToken = buildInternalActorToken(session);
  const response = await fetch(
    `${backendBaseUrl()}/api/v1/export/jobs/${jobId}/pdf`,
    {
      headers: internalActorToken
        ? {
            Authorization: `Bearer ${internalActorToken}`,
          }
        : {
            "X-User-Email": normalizeActorEmail(session),
            "X-User-Name": session.name,
          },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = (await response.text()) || "Export PDF download failed.";
    return NextResponse.json(
      {
        error: {
          code: "qony_export_download_error",
          message: errorText,
        },
      },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        'attachment; filename="qony-export.pdf"',
      "Content-Type":
        response.headers.get("content-type") ?? "application/pdf",
    },
  });
}

function backendBaseUrl() {
  return (
    process.env.QONY_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000"
  );
}

function normalizeActorEmail(session: { email: string; username: string }) {
  const email = session.email.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith("@qony.local")) {
    return email;
  }
  return `${session.username}@qony.ai`;
}
