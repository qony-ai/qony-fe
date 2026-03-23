import {
  type ApiResponse,
  type ExportPreviewPayload,
  type IngestPayload,
  type IngestRequest,
  type ProjectCreateRequest,
  type ProjectDetail,
  type ProjectListPayload,
  type ProjectUpdateRequest,
  type WorkspaceChatRequest,
  type WorkspaceChatResponse,
  type WorkspaceMutationRequest,
  type WorkspaceMutationResult,
  type WorkspacePayload,
} from "@/src/lib/types/api";
import type { AuthSession } from "@/src/lib/auth/types";
import { QonyApiError, executeApiRequest, parseApiRequestBody } from "@/src/lib/api/core";
import {
  mockChatWorkspace,
  mockCreateProject,
  mockDeleteProject,
  mockGetExportPreview,
  mockGetProject,
  mockGetWorkspace,
  mockIngestProject,
  mockListProjects,
  mockMutateWorkspace,
  mockUpdateProject,
} from "@/src/lib/api/mock-store";

export type QonyApiMode = "auto" | "live" | "mock";

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

function readApiMode() {
  const rawMode =
    process.env.QONY_API_MODE ??
    process.env.NEXT_PUBLIC_QONY_API_MODE ??
    "live";

  return rawMode === "live" || rawMode === "mock" ? rawMode : "auto";
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
    .replace("/api/qony/ingest", "/api/v1/ingest")
    .replace("/api/qony/workspace/mutate", "/api/v1/workspace/mutate")
    .replace("/api/qony/workspace/chat", "/api/v1/workspace/chat")
    .replace("/api/qony/workspace", "/api/v1/workspace")
    .replace("/api/qony/export/preview", "/api/v1/export/preview");
}

async function liveRequest<T>(
  path: string,
  init: RequestInit,
  actor?: AuthSession | null,
): Promise<ApiResponse<T>> {
  if (!actor) {
    throw new QonyApiError("Authentication required.", 401);
  }

  return executeApiRequest<T>(backendBaseUrl(), resolveBackendPath(path), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "X-User-Email": normalizeActorEmail(actor),
      "X-User-Name": actor.name,
    },
  });
}

async function mockRequest<T>(
  path: string,
  init: RequestInit,
): Promise<ApiResponse<T>> {
  const method = (init.method ?? "GET").toUpperCase();
  const body = await parseApiRequestBody(init);

  if (path === "/api/qony/projects" && method === "GET") {
    return (await mockListProjects()) as ApiResponse<T>;
  }
  if (path === "/api/qony/projects" && method === "POST") {
    return (await mockCreateProject(body as ProjectCreateRequest)) as ApiResponse<T>;
  }
  if (path.startsWith("/api/qony/projects/")) {
    const projectId = path.replace("/api/qony/projects/", "");
    if (method === "GET") {
      return (await mockGetProject(projectId)) as ApiResponse<T>;
    }
    if (method === "PATCH") {
      return (await mockUpdateProject(
        projectId,
        body as ProjectUpdateRequest,
      )) as ApiResponse<T>;
    }
    if (method === "DELETE") {
      return (await mockDeleteProject(projectId)) as ApiResponse<T>;
    }
  }
  if (path === "/api/qony/ingest" && method === "POST") {
    if (body instanceof FormData) {
      return (await mockIngestProject({
        project_id: String(body.get("project_id") ?? ""),
        raw_text: String(body.get("raw_text") ?? ""),
        source_filename: (body.get("file") as File | null)?.name ?? null,
        source_content_type:
          (body.get("file") as File | null)?.type || "application/pdf",
        replace_existing: String(body.get("replace_existing")) === "true",
      })) as ApiResponse<T>;
    }

    return (await mockIngestProject(body as IngestRequest)) as ApiResponse<T>;
  }
  if (
    path.startsWith("/api/qony/workspace/") &&
    !path.endsWith("/mutate") &&
    !path.endsWith("/chat") &&
    method === "GET"
  ) {
    const projectId = path.replace("/api/qony/workspace/", "");
    return (await mockGetWorkspace(projectId)) as ApiResponse<T>;
  }
  if (path === "/api/qony/workspace/mutate" && method === "PATCH") {
    return (await mockMutateWorkspace(
      body as WorkspaceMutationRequest,
    )) as ApiResponse<T>;
  }
  if (path === "/api/qony/workspace/chat" && method === "POST") {
    return (await mockChatWorkspace(body as WorkspaceChatRequest)) as ApiResponse<T>;
  }
  if (
    path.startsWith("/api/qony/export/preview/") &&
    method === "GET"
  ) {
    const projectId = path.replace("/api/qony/export/preview/", "");
    return (await mockGetExportPreview(projectId)) as ApiResponse<T>;
  }

  throw new QonyApiError(`Unsupported mock API route: ${method} ${path}`, 404);
}

export async function requestQonyApi<T>(
  path: string,
  init: RequestInit = {},
  mode: QonyApiMode = readApiMode(),
  actor?: AuthSession | null,
): Promise<ApiResponse<T>> {
  if (mode === "mock") {
    return mockRequest<T>(path, init);
  }

  if (mode === "live") {
    return liveRequest<T>(path, init, actor);
  }

  try {
    return await liveRequest<T>(path, init, actor);
  } catch (error) {
    if (error instanceof QonyApiError) {
      throw error;
    }

    return mockRequest<T>(path, init);
  }
}

export interface QonyGateway {
  listProjects: () => Promise<ProjectListPayload>;
  createProject: (payload: ProjectCreateRequest) => Promise<ProjectDetail>;
  getProject: (projectId: string) => Promise<ProjectDetail>;
  updateProject: (
    projectId: string,
    payload: ProjectUpdateRequest,
  ) => Promise<ProjectDetail>;
  deleteProject: (projectId: string) => Promise<{ deleted: boolean }>;
  ingestProject: (payload: IngestRequest) => Promise<IngestPayload>;
  getWorkspace: (projectId: string) => Promise<WorkspacePayload>;
  mutateWorkspace: (
    payload: WorkspaceMutationRequest,
  ) => Promise<WorkspaceMutationResult>;
  chatWorkspace: (payload: WorkspaceChatRequest) => Promise<WorkspaceChatResponse>;
  getExportPreview: (projectId: string) => Promise<ExportPreviewPayload>;
}
