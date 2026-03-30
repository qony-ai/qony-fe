import { NextResponse } from "next/server";

import { getBillingPaymentStatus } from "@/src/lib/billing/server";
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
    const url = new URL(request.url);
    const response = await getBillingPaymentStatus(session, url.searchParams);
    return NextResponse.json({ data: response });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "billing_status_failed",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load payment status.",
        },
      },
      { status: 500 },
    );
  }
}
