export type ProjectStatus = "draft" | "active" | "archived";
export type KnowledgeNodeType =
  | "problem"
  | "solution"
  | "assumption"
  | "metric"
  | "stakeholder"
  | "risk"
  | "opportunity"
  | "constraint"
  | "evidence"
  | "market_data"
  | "trend"
  | "competitor"
  | "regulation"
  | "objective"
  | "resource";
export type KnowledgeRelationType =
  | "causes"
  | "supports"
  | "contradicts"
  | "requires"
  | "affects"
  | "related_to"
  | "measured_by"
  | "mitigated_by";
export type KnowledgeNodeSource = "document" | "web" | "user";
export type ExportType = "pitch_deck" | "business_document";
export type ExportJobStatus = "pending" | "processing" | "completed" | "failed";

export interface ResponseMeta {
  request_id?: string | null;
  timestamp?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta | null;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  request_id?: string | null;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface Position {
  x: number;
  y: number;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProjectUpdateRequest {
  name?: string | null;
  description?: string | null;
  status?: ProjectStatus | null;
  metadata?: Record<string, unknown> | null;
}

export interface ProjectSummary {
  id: string;
  graph_id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends ProjectSummary {
  user_email: string;
  user_name: string;
}

export interface ProjectListPayload {
  items: ProjectSummary[];
}

export interface KnowledgeGraphNode {
  id: string;
  type: KnowledgeNodeType;
  title: string;
  description?: string | null;
  source: KnowledgeNodeSource;
  is_enrichment: boolean;
  source_url?: string | null;
  position: Position;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relation_type: KnowledgeRelationType;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraph {
  id: string;
  project_id: string;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeGraphUpdateRequest {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgeNodeCreateRequest {
  type: KnowledgeNodeType;
  title: string;
  description?: string | null;
  source?: KnowledgeNodeSource;
  is_enrichment?: boolean;
  source_url?: string | null;
  position?: Position;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeNodeUpdateRequest {
  type?: KnowledgeNodeType;
  title?: string | null;
  description?: string | null;
  source?: KnowledgeNodeSource;
  is_enrichment?: boolean;
  source_url?: string | null;
  position?: Position;
  metadata?: Record<string, unknown>;
  merge_metadata?: boolean;
}

export interface KnowledgeEdgeCreateRequest {
  source: string;
  target: string;
  relation_type: KnowledgeRelationType;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEdgeUpdateRequest {
  relation_type?: KnowledgeRelationType;
  metadata?: Record<string, unknown>;
  merge_metadata?: boolean;
}

export interface GraphAIEditResponse {
  graph: KnowledgeGraph;
  summary: string;
}

export interface IngestJobRead {
  id: string;
  project_id: string;
  graph_id: string;
  requested_by_user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  provider: string;
  model?: string | null;
  fallback_used: boolean;
  source_filename?: string | null;
  source_content_type?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExportJobRead {
  id: string;
  project_id: string;
  graph_id: string;
  export_type: ExportType;
  status: ExportJobStatus;
  output_url?: string | null;
  slide_plan: Record<string, unknown>;
  metadata: Record<string, unknown>;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutRequest {
  plan_id: string;
  amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
}

export interface CheckoutResponse {
  order_id: string;
  snap_token?: string | null;
  redirect_url?: string | null;
  provider: string;
}

export interface SubscriptionRead {
  id: string;
  user_id: string;
  provider: string;
  plan_id: string;
  status: string;
  order_id?: string | null;
  current_period_end?: string | null;
  metadata: Record<string, unknown>;
}

export interface AdminUserRead {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AdminMetricsRead {
  user_count: number;
  project_count: number;
  graph_count: number;
  upload_count: number;
  scrape_count: number;
  ai_edit_count: number;
  export_count: number;
}

export interface FeatureFlagRead {
  key: string;
  enabled: boolean;
  description: string;
}

export interface FeatureFlagList {
  items: FeatureFlagRead[];
}

export interface DeleteResult {
  deleted: boolean;
}
