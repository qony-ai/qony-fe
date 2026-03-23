import "server-only";

import { getAuthSession } from "@/src/lib/auth/session";
import { buildApiClient } from "@/src/lib/api/core";
import { requestQonyApi } from "@/src/lib/api/gateway";
import type { ApiResponse } from "@/src/lib/types/api";

async function serverFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const method = (init.method ?? "GET").toUpperCase();
  const actor = await getAuthSession();

  return requestQonyApi<T>(
    path,
    method === "GET" ? { ...init, cache: "no-store" } : init,
    undefined,
    actor,
  );
}

export const serverApi = buildApiClient(serverFetch);
