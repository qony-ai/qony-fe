"use client";

import { buildApiClient, executeApiRequest } from "@/src/lib/api/core";
import type { ApiResponse } from "@/src/lib/types/api";

async function browserFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  return executeApiRequest<T>("", path, init);
}

export const browserApi = buildApiClient(browserFetch);
