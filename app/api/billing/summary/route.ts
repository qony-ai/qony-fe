import { NextResponse } from "next/server";

import { getBillingSummary } from "@/src/lib/billing/server";
import { getAuthSessionFromHeaders } from "@/src/lib/auth/session";

export async function GET(request: Request) {
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

  try {
    const response = await getBillingSummary(session);
    return NextResponse.json({ data: response });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "billing_summary_failed",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load billing summary.",
        },
      },
      { status: 500 },
    );
  }
}
