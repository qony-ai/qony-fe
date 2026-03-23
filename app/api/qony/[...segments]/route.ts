import { type NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/src/lib/auth/session";
import { QonyApiError, parseApiRequestBody } from "@/src/lib/api/core";
import { requestQonyApi } from "@/src/lib/api/gateway";

export const dynamic = "force-dynamic";

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;
  const path = `/api/qony/${segments.join("/")}`;
  const method = request.method.toUpperCase();
  const session = await getAuthSession();

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
    const body =
      method === "GET" || method === "DELETE"
        ? undefined
        : request.headers.get("content-type")?.includes("multipart/form-data")
          ? await request.formData()
          : await parseApiRequestBody({
              body: await request.text(),
            });

    const response = await requestQonyApi(
      path,
      {
        method,
        body:
          body instanceof FormData
            ? body
            : body !== undefined
              ? JSON.stringify(body)
              : undefined,
      },
      undefined,
      session,
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof QonyApiError) {
      return NextResponse.json(
        {
          error: {
            code: "qony_api_error",
            message: error.message,
            details: error.payload ?? null,
          },
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "unexpected_error",
          message:
            error instanceof Error
              ? error.message
              : "Unexpected Qony API route failure.",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  return handleRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  return handleRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  return handleRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  return handleRequest(request, context);
}
