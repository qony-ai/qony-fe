import { NextResponse } from "next/server";

import { createBillingCheckout } from "@/src/lib/billing/server";
import { getAuthSessionFromHeaders } from "@/src/lib/auth/session";

export async function POST(request: Request) {
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

  const payload = (await request.json()) as {
    plan?: "free" | "pro";
    source?: "billing" | "pricing";
  } | null;

  try {
    const response = await createBillingCheckout(session, {
      plan: payload?.plan === "pro" ? "pro" : "free",
      source: payload?.source || "pricing",
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "billing_checkout_failed",
          message:
            error instanceof Error
              ? error.message
              : "Unable to start the billing flow.",
        },
      },
      { status: 500 },
    );
  }
}
