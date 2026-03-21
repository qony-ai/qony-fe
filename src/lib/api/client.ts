"use client";

import { buildApiClient, QonyApiError } from "@/src/lib/api/core";
import type { ApiErrorResponse, ApiResponse } from "@/src/lib/types/api";

const browserBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function browserFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${browserBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  const raw = (await response.text()) || "";
  const payload = raw ? (JSON.parse(raw) as ApiResponse<T> | ApiErrorResponse) : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null;
    throw new QonyApiError(
      errorPayload?.error.message ?? `API request failed with status ${response.status}`,
      response.status,
      errorPayload ?? undefined,
    );
  }

  return payload as ApiResponse<T>;
}

export const browserApi = buildApiClient(browserFetch);
