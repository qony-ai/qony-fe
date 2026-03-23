export type ProjectStatus = "draft" | "active" | "archived";
export type NodeSource = "manual" | "ingest" | "ai";
export type MutationActor = "user" | "ai";
export type NodeRank = 1 | 2 | 3 | 4 | 5 | 6;

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
  rank: NodeRank;
  kind: string;
  title: string;
  content?: string | null;
  source: NodeSource;
  position: Position;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
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

export interface ExportStep {
  node_id: string;
  rank: NodeRank;
  kind: string;
  title: string;
  content?: string | null;
}

export interface ExportChain {
  chain_id: string;
  steps: ExportStep[];
}

export interface ExportPreviewPayload {
  snapshot_id: string;
  project_id: string;
  workspace_id: string;
  generated_at: string;
  branch_count: number;
  chains: ExportChain[];
  narrative?: string | null;
  warnings: string[];
}

export interface NodeDraft {
  id?: string;
  rank: NodeRank;
  title: string;
  content?: string | null;
  source?: NodeSource;
  position?: Position;
  metadata?: Record<string, unknown>;
}

export interface EdgeDraft {
  id?: string;
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
  rank?: NodeRank;
  title?: string;
  content?: string | null;
  source?: NodeSource;
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
  position?: Position;
  rank?: NodeRank;
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
