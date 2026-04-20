import {
  type AdminMetricsRead,
  type AdminUserRead,
  type ApiErrorResponse,
  type ApiResponse,
  type CheckoutRequest,
  type CheckoutResponse,
  type DeleteResult,
  type ExportJobRead,
  type FeatureFlagList,
  type GraphAIEditResponse,
  type IngestJobRead,
  type KnowledgeEdgeCreateRequest,
  type KnowledgeEdgeUpdateRequest,
  type KnowledgeGraph,
  type KnowledgeGraphEdge,
  type KnowledgeGraphNode,
  type KnowledgeGraphUpdateRequest,
  type KnowledgeNodeCreateRequest,
  type KnowledgeNodeUpdateRequest,
  type ProjectCreateRequest,
  type ProjectDetail,
  type ProjectListPayload,
  type ProjectUpdateRequest,
  type SubscriptionRead,
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

export async function executeApiRequest<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${baseUrl}${path}`, {
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

export async function parseApiRequestBody(init: RequestInit = {}) {
  if (init.body instanceof FormData) {
    return init.body;
  }

  if (typeof init.body === "string") {
    return init.body.length > 0 ? JSON.parse(init.body) : undefined;
  }

  if (
    init.body &&
    typeof init.body === "object" &&
    "getReader" in init.body === false
  ) {
    return init.body;
  }

  return undefined;
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
    async getProjectGraph(projectId: string) {
      return (await fetcher<KnowledgeGraph>(apiEndpoints.projectGraph(projectId))).data;
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
    async ingestProjectFile(projectId: string, formData: FormData) {
      return (
        await fetcher<IngestJobRead>(apiEndpoints.projectIngest(projectId), {
          method: "POST",
          body: formData,
        })
      ).data;
    },
    async getGraph(graphId: string) {
      return (await fetcher<KnowledgeGraph>(apiEndpoints.graph(graphId))).data;
    },
    async updateGraph(graphId: string, payload: KnowledgeGraphUpdateRequest) {
      return (
        await fetcher<KnowledgeGraph>(apiEndpoints.graph(graphId), {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async aiEditGraph(graphId: string, prompt: string) {
      return (
        await fetcher<GraphAIEditResponse>(apiEndpoints.graphAiEdit(graphId), {
          method: "POST",
          body: JSON.stringify({ prompt }),
        })
      ).data;
    },
    async createNode(graphId: string, payload: KnowledgeNodeCreateRequest) {
      return (
        await fetcher<KnowledgeGraphNode>(apiEndpoints.nodeCollection(graphId), {
          method: "POST",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async updateNode(nodeId: string, payload: KnowledgeNodeUpdateRequest) {
      return (
        await fetcher<KnowledgeGraphNode>(apiEndpoints.node(nodeId), {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async deleteNode(nodeId: string) {
      return (
        await fetcher<DeleteResult>(apiEndpoints.node(nodeId), {
          method: "DELETE",
        })
      ).data;
    },
    async createEdge(graphId: string, payload: KnowledgeEdgeCreateRequest) {
      return (
        await fetcher<KnowledgeGraphEdge>(apiEndpoints.edgeCollection(graphId), {
          method: "POST",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async updateEdge(edgeId: string, payload: KnowledgeEdgeUpdateRequest) {
      return (
        await fetcher<KnowledgeGraphEdge>(apiEndpoints.edge(edgeId), {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async deleteEdge(edgeId: string) {
      return (
        await fetcher<DeleteResult>(apiEndpoints.edge(edgeId), {
          method: "DELETE",
        })
      ).data;
    },
    async createExport(graphId: string, exportType: "pitch_deck" | "business_document") {
      return (
        await fetcher<ExportJobRead>(apiEndpoints.graphExport(graphId), {
          method: "POST",
          body: JSON.stringify({ export_type: exportType }),
        })
      ).data;
    },
    async getExportJob(jobId: string) {
      return (await fetcher<ExportJobRead>(apiEndpoints.exportJob(jobId))).data;
    },
    async checkout(payload: CheckoutRequest) {
      return (
        await fetcher<CheckoutResponse>(apiEndpoints.paymentCheckout, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      ).data;
    },
    async getSubscription() {
      return (await fetcher<SubscriptionRead | null>(apiEndpoints.paymentSubscription)).data;
    },
    async listAdminUsers() {
      return (await fetcher<AdminUserRead[]>(apiEndpoints.adminUsers)).data;
    },
    async getAdminMetrics() {
      return (await fetcher<AdminMetricsRead>(apiEndpoints.adminMetrics)).data;
    },
    async getAdminFlags() {
      return (await fetcher<FeatureFlagList>(apiEndpoints.adminFlags)).data;
    },
  };
}
