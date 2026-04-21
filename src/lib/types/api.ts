export type ProjectStatus = "draft" | "active" | "archived";
export type NodeSource = "document" | "web" | "user";
export type MutationActor = "user" | "ai";

export type NodeType =
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

export type EdgeRelationType =
  | "causes"
  | "supports"
  | "contradicts"
  | "requires"
  | "affects"
  | "related_to"
  | "measured_by"
  | "mitigated_by";

export const NODE_TYPES: readonly NodeType[] = [
  "problem",
  "solution",
  "assumption",
  "metric",
  "stakeholder",
  "risk",
  "opportunity",
  "constraint",
  "evidence",
  "market_data",
  "trend",
  "competitor",
  "regulation",
  "objective",
  "resource",
] as const;

export const EDGE_RELATION_TYPES: readonly EdgeRelationType[] = [
  "causes",
  "supports",
  "contradicts",
  "requires",
  "affects",
  "related_to",
  "measured_by",
  "mitigated_by",
] as const;

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

export interface GraphValidationIssue {
  code: string;
  message: string;
  node_id?: string | null;
  edge_id?: string | null;
}

export interface GraphValidationSummary {
  is_valid: boolean;
  issues: GraphValidationIssue[];
  reachable_node_count: number;
  complete_branch_count: number;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  source: NodeSource;
  is_enrichment: boolean;
  source_url?: string | null;
  confidence: number;
  position: Position;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  type: EdgeRelationType;
  source: string;
  target: string;
  label?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GraphMetadata {
  project_id: string;
  workspace_id: string;
  version: number;
  updated_at: string;
  validation: GraphValidationSummary;
  attributes: Record<string, unknown>;
}

export interface WorkspaceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface WorkspaceChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  graph_version?: number | null;
  applied_commands: string[];
  ai_request_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceChatState {
  messages: WorkspaceChatMessage[];
}

export interface WorkspacePayload {
  project_id: string;
  workspace_id: string;
  graph: WorkspaceGraph;
  chat: WorkspaceChatState;
}

export interface WorkspaceMutationResult {
  project_id: string;
  workspace_id: string;
  graph: WorkspaceGraph;
  applied_commands: string[];
  ai_commands_applied: number;
  ai_request_id?: string | null;
}

export interface WorkspaceChatRequest {
  project_id: string;
  message: string;
  expected_version?: number | null;
  selected_node_id?: string | null;
}

export interface WorkspaceChatResponse {
  project_id: string;
  workspace_id: string;
  graph: WorkspaceGraph;
  chat: WorkspaceChatState;
  assistant_message: WorkspaceChatMessage;
  applied_commands: string[];
  ai_commands_applied: number;
  ai_request_id?: string | null;
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
  workspace_id: string;
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

export interface DeleteResult {
  deleted: boolean;
}

export interface ProjectListPayload {
  items: ProjectSummary[];
}

export interface IngestRequest {
  project_id: string;
  raw_text: string;
  source_filename?: string | null;
  source_content_type?: string | null;
  replace_existing?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IngestPayload {
  job: {
    id: string;
    project_id: string;
    workspace_id: string;
    requested_by_user_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    provider: string;
    model?: string | null;
    fallback_used: boolean;
    created_at: string;
    updated_at: string;
  };
  graph: WorkspaceGraph;
}

export type DeliverableType = "pitch_deck" | "business_document";
export type ExportJobStatus =
  | "pending"
  | "planning"
  | "rendering"
  | "completed"
  | "failed";

export interface ExportSlideStep {
  component_key: string;
  title: string;
  variables: Record<string, unknown>;
  source_node_ids: string[];
}

export interface ExportSlidePlan {
  deliverable_type: DeliverableType;
  manifest_version: string;
  steps: ExportSlideStep[];
  warnings: string[];
}

export interface ExportPreviewPayload {
  snapshot_id: string;
  project_id: string;
  workspace_id: string;
  project_name: string;
  generated_at: string;
  graph_version?: number | null;
  deliverable_type?: DeliverableType | null;
  manifest_version?: string | null;
  slide_plan?: ExportSlidePlan | null;
  status: "ready" | "stub";
  warnings: string[];
}

export interface ExportJobCreateRequest {
  project_id: string;
  deliverable_type: DeliverableType;
}

export interface ExportJob {
  id: string;
  project_id: string;
  workspace_id: string;
  deliverable_type: DeliverableType;
  status: ExportJobStatus;
  graph_version_at_request?: number | null;
  manifest_version?: string | null;
  slide_plan?: ExportSlidePlan | null;
  warnings: string[];
  html_artifact_path?: string | null;
  pdf_artifact_path?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NodeDraft {
  id?: string;
  type: NodeType;
  title: string;
  description: string;
  source?: NodeSource;
  is_enrichment?: boolean;
  source_url?: string | null;
  confidence?: number;
  position?: Position;
  metadata?: Record<string, unknown>;
}

export interface EdgeDraft {
  id?: string;
  type: EdgeRelationType;
  source: string;
  target: string;
  label?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AddNodeCommand {
  type: "add_node";
  node: NodeDraft;
}

export interface UpdateNodeCommand {
  type: "update_node";
  node_id: string;
  node_type?: NodeType;
  title?: string;
  description?: string;
  source?: NodeSource;
  is_enrichment?: boolean;
  source_url?: string | null;
  confidence?: number;
  position?: Position;
  metadata?: Record<string, unknown>;
  merge_metadata?: boolean;
}

export interface DeleteNodeCommand {
  type: "delete_node";
  node_id: string;
}

export interface AddEdgeCommand {
  type: "add_edge";
  edge: EdgeDraft;
}

export interface DeleteEdgeCommand {
  type: "delete_edge";
  edge_id?: string;
  source?: string;
  target?: string;
}

export interface MoveNodeCommand {
  type: "move_node";
  node_id: string;
  position: Position;
}

export type PatchCommand =
  | AddNodeCommand
  | UpdateNodeCommand
  | DeleteNodeCommand
  | AddEdgeCommand
  | DeleteEdgeCommand
  | MoveNodeCommand;

export interface ApplyAIPatchCommand {
  type: "apply_ai_patch";
  instruction?: string | null;
  commands?: PatchCommand[];
  audit_metadata?: Record<string, unknown>;
}

export type MutationCommand = PatchCommand | ApplyAIPatchCommand;

export interface WorkspaceMutationRequest {
  project_id: string;
  expected_version?: number | null;
  actor?: MutationActor;
  reason?: string | null;
  commands: MutationCommand[];
}
