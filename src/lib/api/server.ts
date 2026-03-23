import "server-only";

import { cache } from "react";

import { getAuthSession } from "@/src/lib/auth/session";
import { buildApiClient } from "@/src/lib/api/core";
import { requestQonyApi } from "@/src/lib/api/gateway";
import type { ApiResponse } from "@/src/lib/types/api";

const cachedServerGet = cache(async (path: string, actorKey: string) => {
  const [email, name] = actorKey.split("::");
  return requestQonyApi<unknown>(
    path,
    { method: "GET" },
    undefined,
    email && name
      ? {
          username: email.split("@")[0] || name.toLowerCase().replace(/\s+/g, "."),
          email,
          name,
        }
      : null,
  );
});

async function serverFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const method = (init.method ?? "GET").toUpperCase();
  const canUseCachedGet =
    method === "GET" &&
    !init.body &&
    init.headers === undefined &&
    init.signal === undefined &&
    init.next === undefined;
  const actor = await getAuthSession();
  const actorKey = actor ? `${actor.email}::${actor.name}` : "";

  if (canUseCachedGet) {
    return (await cachedServerGet(path, actorKey)) as ApiResponse<T>;
  }

  return requestQonyApi<T>(path, init, undefined, actor);
}

export const serverApi = buildApiClient(serverFetch);
