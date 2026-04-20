import type { ApiResponse } from "@/src/lib/types/api";
import type { AuthSession } from "@/src/lib/auth/types";
import { buildInternalActorToken } from "@/src/lib/auth/internal-actor";
import { QonyApiError, executeApiRequest } from "@/src/lib/api/core";

function hasValidActorEmailShape(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeActorEmail(actor: AuthSession) {
  const email = actor.email.trim().toLowerCase();
  if (hasValidActorEmailShape(email) && !email.endsWith("@qony.local")) {
    return email;
  }

  return `${actor.username}@qony.ai`;
}

function backendBaseUrl() {
  return (
    process.env.QONY_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000"
  );
}

function resolveBackendPath(path: string) {
  return path
    .replace("/api/qony/projects", "/api/v1/projects")
    .replace("/api/qony/graphs", "/api/v1/graphs")
    .replace("/api/qony/nodes", "/api/v1/nodes")
    .replace("/api/qony/edges", "/api/v1/edges")
    .replace("/api/qony/exports", "/api/v1/exports")
    .replace("/api/qony/payment", "/api/v1/payment")
    .replace("/api/qony/admin", "/api/v1/admin");
}

export async function requestQonyApi<T>(
  path: string,
  init: RequestInit = {},
  actor?: AuthSession | null,
): Promise<ApiResponse<T>> {
  if (!actor) {
    throw new QonyApiError("Authentication required.", 401);
  }

  const internalActorToken = buildInternalActorToken(actor);

  return executeApiRequest<T>(backendBaseUrl(), resolveBackendPath(path), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(internalActorToken
        ? {
            Authorization: `Bearer ${internalActorToken}`,
          }
        : {
            "X-User-Email": normalizeActorEmail(actor),
            "X-User-Name": actor.name,
          }),
    },
  });
}
