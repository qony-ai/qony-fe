import {
  type ApiErrorResponse,
  type ApiResponse,
  type DeleteResult,
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
import { apiEndpoints } from "@/src/lib/api/endpoints";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<ApiResponse<T>>;

export class QonyApiError extends Error {
  readonly status: number;
  readonly payload?: ApiErrorResponse;

  constructor(message: string, status: number, payload?: ApiErrorResponse) {
    super(message);
    this.name = "QonyApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function buildApiClient(fetcher: Fetcher) {
  return {
    async listProjects() {
      return (await fetcher<ProjectListPayload>(apiEndpoints.projects)).data;
    },
    async createProject(payload: ProjectCreateRequest) {
      return (
        await fetcher<ProjectDetail>(apiEndpoints.projects, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async getProject(projectId: string) {
      return (await fetcher<ProjectDetail>(apiEndpoints.project(projectId))).data;
    },
    async updateProject(projectId: string, payload: ProjectUpdateRequest) {
      return (
        await fetcher<ProjectDetail>(apiEndpoints.project(projectId), {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async deleteProject(projectId: string) {
      return (
        await fetcher<DeleteResult>(apiEndpoints.project(projectId), {
          method: "DELETE",
        })
      ).data;
    },
    async ingestProject(payload: IngestRequest) {
      return (
        await fetcher<IngestPayload>(apiEndpoints.ingest, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async ingestProjectFormData(formData: FormData) {
      return (
        await fetcher<IngestPayload>(apiEndpoints.ingest, {
          method: "POST",
          body: formData,
        })
      ).data;
    },
    async getWorkspace(projectId: string) {
      return (await fetcher<WorkspacePayload>(apiEndpoints.workspace(projectId))).data;
    },
    async mutateWorkspace(payload: WorkspaceMutationRequest) {
      return (
        await fetcher<WorkspaceMutationResult>(apiEndpoints.mutateWorkspace, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async chatWorkspace(payload: WorkspaceChatRequest) {
      return (
        await fetcher<WorkspaceChatResponse>(apiEndpoints.chatWorkspace, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async getExportPreview(projectId: string) {
      return (
        await fetcher<ExportPreviewPayload>(apiEndpoints.exportPreview(projectId))
      ).data;
    },
  };
}
