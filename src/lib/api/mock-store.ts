import {
  type AddEdgeCommand,
  type AddNodeCommand,
  type ApiResponse,
  type ExportChain,
  type ExportPreviewPayload,
  type GraphEdge,
  type GraphMetadata,
  type GraphNode,
  type GraphValidationIssue,
  type GraphValidationSummary,
  type IngestPayload,
  type IngestRequest,
  type MutationCommand,
  type NodeLevel,
  type ProjectCreateRequest,
  type ProjectDetail,
  type ProjectListPayload,
  type ProjectSummary,
  type ProjectUpdateRequest,
  type WorkspaceChatMessage,
  type WorkspaceChatRequest,
  type WorkspaceChatResponse,
  type WorkspaceMutationRequest,
  type WorkspaceMutationResult,
  type WorkspacePayload,
  type WorkspaceGraph,
} from "@/src/lib/types/api";
import {
  buildFrameworkSuggestion,
  detectFrameworkFromText,
  resolveFrameworkRecommendationContext,
} from "@/src/lib/workspace/frameworks";
import { QonyApiError } from "@/src/lib/api/core";
import { readBranchIndex } from "@/src/lib/workspace/graph-layout";
import { getNextRank } from "@/src/lib/workspace/ranks";
import { slugify } from "@/src/lib/utils";

interface MockDatabase {
  projects: Record<string, ProjectDetail>;
  workspaces: Record<string, WorkspacePayload>;
}

interface SeedProject {
  id: string;
  name: string;
  description: string;
  status: ProjectSummary["status"];
  nodes: Array<{
    id: string;
    rank: NodeLevel;
    title: string;
    content: string;
    branchIndex?: number;
  }>;
  edges: Array<{ source: string; target: string }>;
}

const seedProjects: SeedProject[] = [
  {
    id: "case-retail-revenue",
    name: "Retail Revenue Compression",
    description: "Diagnose margin erosion in a national retail chain.",
    status: "active",
    nodes: [
      {
        id: "p1",
        rank: 1,
        title: "Why is revenue quality deteriorating despite traffic growth?",
        content:
          "The executive team needs a branch-level explanation for margin pressure before planning the 2026 budget.",
      },
      {
        id: "p2",
        rank: 2,
        title: "Traffic-to-basket conversion weakness",
        content:
          "Footfall is up, but customers are buying fewer high-margin items per visit.",
        branchIndex: 0,
      },
      {
        id: "p3",
        rank: 2,
        title: "Promotion mix is diluting profitability",
        content:
          "Discount-led acquisition is pulling demand forward while training buyers to wait for promotions.",
        branchIndex: 1,
      },
      {
        id: "p4",
        rank: 3,
        title: "Assortment gaps reduce attachment purchases",
        content:
          "Stores with weak category adjacency are converting traffic into smaller baskets.",
        branchIndex: 0,
      },
      {
        id: "p5",
        rank: 3,
        title: "Blanket discounting is cannibalizing full-price demand",
        content:
          "High-frequency discounting shifts sales into promo windows without materially expanding the customer base.",
        branchIndex: 1,
      },
      {
        id: "p6",
        rank: 4,
        title: "Compare basket mix by store archetype",
        content:
          "Segment stores by traffic growth, attachment-rate trend, and adjacent category availability.",
        branchIndex: 0,
      },
      {
        id: "p7",
        rank: 4,
        title: "Model incremental margin from promotion cohorts",
        content:
          "Estimate gross margin impact by campaign, customer segment, and reversion to full-price buying behavior.",
        branchIndex: 1,
      },
      {
        id: "p8",
        rank: 5,
        title: "Category adjacency audit shows 14-point basket gap",
        content:
          "Stores missing three or more complementary categories underperform on average basket value by 14%.",
        branchIndex: 0,
      },
      {
        id: "p9",
        rank: 5,
        title: "Promo cohort analysis shows low post-campaign retention",
        content:
          "Customers acquired through blanket markdowns have lower 90-day retention and lower full-price recovery.",
        branchIndex: 1,
      },
      {
        id: "p10",
        rank: 6,
        title: "Refocus growth on basket quality, not pure traffic",
        content:
          "Prioritize assortment repair in high-traffic stores and replace blanket markdowns with narrower, segment-led offers.",
        branchIndex: 0,
      },
      {
        id: "p11",
        rank: 6,
        title: "Promotions need margin guardrails",
        content:
          "Tie campaign approval to incremental margin thresholds and transition to targeted offers where elasticity supports it.",
        branchIndex: 1,
      },
    ],
    edges: [
      { source: "p1", target: "p2" },
      { source: "p1", target: "p3" },
      { source: "p2", target: "p4" },
      { source: "p3", target: "p5" },
      { source: "p4", target: "p6" },
      { source: "p5", target: "p7" },
      { source: "p6", target: "p8" },
      { source: "p7", target: "p9" },
      { source: "p8", target: "p10" },
      { source: "p9", target: "p11" },
    ],
  },
  {
    id: "case-market-entry",
    name: "B2B Market Entry Thesis",
    description: "Assess which segment Qony AI should enter first.",
    status: "draft",
    nodes: [
      {
        id: "m1",
        rank: 1,
        title: "Which customer segment creates the fastest path to repeat usage?",
        content:
          "We need a realistic wedge that proves value quickly and creates strong expansion economics.",
      },
      {
        id: "m2",
        rank: 2,
        title: "Consulting teams handling strategy cases",
        content:
          "Teams already operate with structured logic trees and benefit from faster synthesis.",
        branchIndex: 0,
      },
      {
        id: "m3",
        rank: 2,
        title: "Corporate strategy and planning teams",
        content:
          "Internal teams need cross-functional evidence gathering and reusable strategic narratives.",
        branchIndex: 1,
      },
      {
        id: "m4",
        rank: 3,
        title: "Consulting teams have higher workflow urgency",
        content:
          "Billable case cycles make time savings immediately valuable and visible.",
        branchIndex: 0,
      },
      {
        id: "m5",
        rank: 3,
        title: "Corporate teams have stickier longitudinal value",
        content:
          "Once embedded into planning rituals, the workspace becomes part of review and decision cadence.",
        branchIndex: 1,
      },
      {
        id: "m6",
        rank: 4,
        title: "Measure consulting ROI inside active case cycles",
        content:
          "Pilot teams can quantify time saved and show value within live engagements.",
        branchIndex: 0,
      },
      {
        id: "m7",
        rank: 4,
        title: "Map adoption triggers across planning cadences",
        content:
          "Recurring planning rituals create reuse, but rollout and change management move more slowly.",
        branchIndex: 1,
      },
      {
        id: "m8",
        rank: 5,
        title: "Pilot teams show visible week-one time savings",
        content:
          "Early consulting pilots can demonstrate faster synthesis and clearer branch ownership within days.",
        branchIndex: 0,
      },
      {
        id: "m9",
        rank: 5,
        title: "Planning teams show stronger long-run stickiness",
        content:
          "Internal strategy groups become sticky once templates and review rituals are in place, but the proof cycle is longer.",
        branchIndex: 1,
      },
      {
        id: "m10",
        rank: 6,
        title: "Start with consulting-style teams, then expand into internal strategy",
        content:
          "The wedge should optimize for urgency and demonstrable ROI, while the roadmap prepares templates for recurring internal planning use cases.",
        branchIndex: 0,
      },
    ],
    edges: [
      { source: "m1", target: "m2" },
      { source: "m1", target: "m3" },
      { source: "m2", target: "m4" },
      { source: "m3", target: "m5" },
      { source: "m4", target: "m6" },
      { source: "m5", target: "m7" },
      { source: "m6", target: "m8" },
      { source: "m7", target: "m9" },
      { source: "m8", target: "m10" },
      { source: "m9", target: "m10" },
    ],
  },
  {
    id: "case-empty-template",
    name: "Blank Strategic Case",
    description: "Start from a blank structured workspace.",
    status: "draft",
    nodes: [],
    edges: [],
  },
];

let mockDatabase = createInitialDatabase();

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createInitialDatabase(): MockDatabase {
  const projects: MockDatabase["projects"] = {};
  const workspaces: MockDatabase["workspaces"] = {};

  seedProjects.forEach((project, index) => {
    const createdAt = new Date(Date.now() - index * 1000 * 60 * 60 * 12).toISOString();
    const workspaceId = `workspace-${project.id}`;
    const detail: ProjectDetail = {
      id: project.id,
      workspace_id: workspaceId,
      name: project.name,
      description: project.description,
      status: project.status,
      metadata: {
        owner: index % 2 === 0 ? "Strategy" : "Growth",
        priority: index === 0 ? "urgent" : "active",
      },
      created_at: createdAt,
      updated_at: createdAt,
      user_email: "demo@qony.ai",
      user_name: "Qony Demo",
    };

    projects[detail.id] = detail;
    workspaces[detail.id] = createWorkspaceFromSeed(project, detail);
  });

  return { projects, workspaces };
}

function createWorkspaceFromSeed(
  seed: SeedProject,
  project: ProjectDetail,
): WorkspacePayload {
  const timestamp = project.updated_at;
  const nodes = seed.nodes.map((node, index) =>
    createGraphNode({
      id: node.id,
      rank: node.rank,
      title: node.title,
      content: node.content,
      source: seed.id === "case-empty-template" ? "manual" : "ingest",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: node.branchIndex,
      offset: index,
    }),
  );

  const edges = seed.edges.map((edge, index) => createGraphEdge(edge, timestamp, index));
  const metadata = buildGraphMetadata(project.id, project.workspace_id, nodes, edges, {
    ingest_mode: seed.nodes.length > 0 ? "mock-seed" : "mock-empty",
    provider_attempted: "mock-engine",
  });

  return {
    project_id: project.id,
    workspace_id: project.workspace_id,
    graph: {
      nodes,
      edges,
      metadata,
    },
    chat: {
      messages:
        seed.nodes.length > 0
          ? [
              createChatMessage({
                role: "assistant",
                content:
                  "Workspace seeded from the Qony mock dataset. Add, connect, and refine nodes to shape the final story.",
                graphVersion: metadata.version,
                appliedCommands: [],
                createdAt: timestamp,
              }),
            ]
          : [],
    },
  };
}

function createGraphNode({
  id,
  rank,
  title,
  content,
  source,
  createdAt,
  updatedAt,
  branchIndex,
  offset,
}: {
  id: string;
  rank: NodeLevel;
  title: string;
  content: string;
  source: GraphNode["source"];
  createdAt: string;
  updatedAt: string;
  branchIndex?: number;
  offset: number;
}): GraphNode {
  return {
    id,
    rank,
    kind: slugify(title.split(" ").slice(0, 2).join(" ")) || `rank-${rank}`,
    title,
    content,
    source,
    position: {
      x: (rank - 1) * 320,
      y: (branchIndex ?? 0) * 230 + (offset % 2) * 18,
    },
    metadata:
      branchIndex !== undefined
        ? { branch_index: branchIndex, lane_hint: branchIndex }
        : {},
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function createGraphEdge(
  edge: { source: string; target: string },
  timestamp: string,
  index: number,
): GraphEdge {
  return {
    id: `edge-${index}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    label: null,
    metadata: {},
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function buildGraphMetadata(
  projectId: string,
  workspaceId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  attributes: Record<string, unknown>,
  version = 1,
): GraphMetadata {
  return {
    project_id: projectId,
    workspace_id: workspaceId,
    version,
    updated_at: nowIso(),
    validation: validateGraph(nodes, edges),
    attributes,
  };
}

function validateGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphValidationSummary {
  const issues: GraphValidationIssue[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const roots = nodes.filter((node) => node.rank === 1);
  const reachable = new Set<string>();
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (!source || !target) {
      issues.push({
        code: "missing_node",
        message: "Edge references a missing node.",
        edge_id: edge.id,
      });
      return;
    }

    if (target.rank !== source.rank + 1) {
      issues.push({
        code: "invalid_rank_jump",
        message: `Rank ${source.rank} can only connect to Rank ${source.rank + 1}.`,
        edge_id: edge.id,
      });
    }

    adjacency.set(source.id, [...(adjacency.get(source.id) ?? []), target.id]);
  });

  function walk(nodeId: string) {
    if (reachable.has(nodeId)) {
      return;
    }
    reachable.add(nodeId);
    (adjacency.get(nodeId) ?? []).forEach(walk);
  }

  roots.forEach((root) => walk(root.id));

  if (nodes.length > 0 && roots.length === 0) {
    issues.push({
      code: "missing_root",
      message: "A valid workspace needs at least one Rank 1 node.",
    });
  }

  if (roots.length > 1) {
    issues.push({
      code: "multiple_roots",
      message: "A valid workspace can only have one Rank 1 node.",
    });
  }

  nodes.forEach((node) => {
    if (node.rank !== 1 && !edges.some((edge) => edge.target === node.id)) {
      issues.push({
        code: "orphan_node",
        message: "Node is disconnected from the main logic tree.",
        node_id: node.id,
      });
    }
  });

  const completeBranchCount =
    issues.length === 0 ? countCompleteBranches(roots, adjacency, nodeMap) : 0;

  return {
    is_valid: issues.length === 0,
    issues,
    reachable_node_count: reachable.size,
    complete_branch_count: completeBranchCount,
  };
}

function countCompleteBranches(
  roots: GraphNode[],
  adjacency: Map<string, string[]>,
  nodeMap: Map<string, GraphNode>,
) {
  return deriveCompleteNodePaths(roots, adjacency, nodeMap).length;
}

function deriveCompleteNodePaths(
  roots: GraphNode[],
  adjacency: Map<string, string[]>,
  nodeMap: Map<string, GraphNode>,
) {
  const paths: GraphNode[][] = [];

  function walk(path: GraphNode[]) {
    const current = path[path.length - 1];
    const nextIds = adjacency.get(current.id) ?? [];

    if (nextIds.length === 0) {
      if (
        path.length === 6 &&
        current.rank === 6 &&
        path.every((node, index) => node.rank === index + 1)
      ) {
        paths.push(path);
      }
      return;
    }

    nextIds.forEach((id) => {
      const nextNode = nodeMap.get(id);
      if (!nextNode || path.some((node) => node.id === nextNode.id)) {
        return;
      }

      walk([...path, nextNode]);
    });
  }

  roots.forEach((root) => walk([root]));
  return paths;
}

function summarizeValidationIssues(issues: GraphValidationIssue[]) {
  return issues
    .slice(0, 2)
    .map((issue) => issue.message)
    .join(" ");
}

function buildExportPreview(workspace: WorkspacePayload): ExportPreviewPayload {
  const validation = workspace.graph.metadata.validation;
  const chains = validation.is_valid ? deriveChains(workspace.graph) : [];
  const warnings = [
    ...(!validation.is_valid
      ? [
          `Resolve workspace validation issues before exporting. ${summarizeValidationIssues(validation.issues)}`.trim(),
        ]
      : []),
    ...(chains.length === 0
      ? [
          "No complete rank-1-to-rank-6 branch is available yet. Finish at least one branch before exporting.",
        ]
      : []),
  ];

  return {
    snapshot_id: `snapshot-${workspace.project_id}-${workspace.graph.metadata.version}`,
    project_id: workspace.project_id,
    workspace_id: workspace.workspace_id,
    generated_at: nowIso(),
    branch_count: chains.length,
    chains,
    narrative:
      chains.length > 0
        ? `Qony prepared ${chains.length} exportable logic branch${chains.length > 1 ? "es" : ""}. Review the active slide stream to tighten the final storyline before exporting.`
        : validation.is_valid
          ? "The workspace is still forming. Use the graph editor or copilot to complete at least one end-to-end branch."
          : "The workspace cannot be exported yet. Resolve the validation issues in the canvas, then generate the preview again.",
    warnings,
  };
}

function deriveChains(graph: WorkspaceGraph): ExportChain[] {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  graph.edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  });

  const roots = graph.nodes.filter((node) => node.rank === 1);
  return deriveCompleteNodePaths(roots, adjacency, nodeMap).map((path, index) => ({
    chain_id: `chain-${index + 1}`,
    steps: path.map((node) => ({
      node_id: node.id,
      rank: node.rank,
      kind: node.kind,
      title: node.title,
      content: node.content,
    })),
  }));
}

function readProject(projectId: string) {
  const project = mockDatabase.projects[projectId];
  if (!project) {
    throw new QonyApiError(`Project ${projectId} not found.`, 404);
  }
  return project;
}

function readWorkspace(projectId: string) {
  const workspace = mockDatabase.workspaces[projectId];
  if (!workspace) {
    throw new QonyApiError(`Workspace ${projectId} not found.`, 404);
  }
  return workspace;
}

function buildProjectSummary(project: ProjectDetail): ProjectSummary {
  return {
    id: project.id,
    workspace_id: project.workspace_id,
    name: project.name,
    description: project.description,
    status: project.status,
    metadata: project.metadata,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function updateWorkspace(
  projectId: string,
  updater: (workspace: WorkspacePayload) => WorkspacePayload,
) {
  const nextWorkspace = updater(clone(readWorkspace(projectId)));
  mockDatabase.workspaces[projectId] = nextWorkspace;
  mockDatabase.projects[projectId] = {
    ...mockDatabase.projects[projectId],
    updated_at: nextWorkspace.graph.metadata.updated_at,
  };
  return nextWorkspace;
}

function rebuildWorkspaceGraph(
  workspace: WorkspacePayload,
  graph: WorkspaceGraph,
): WorkspacePayload {
  return {
    ...workspace,
    graph: {
      ...graph,
      metadata: buildGraphMetadata(
        workspace.project_id,
        workspace.workspace_id,
        graph.nodes,
        graph.edges,
        {
          ...graph.metadata.attributes,
        },
        workspace.graph.metadata.version + 1,
      ),
    },
  };
}

function assertExpectedVersion(
  workspace: WorkspacePayload,
  expectedVersion?: number | null,
) {
  if (
    typeof expectedVersion === "number" &&
    expectedVersion !== workspace.graph.metadata.version
  ) {
    throw new QonyApiError(
      "Workspace version conflict. Refresh the canvas and retry your change.",
      409,
    );
  }
}

function assertSingleRootConstraint(
  workspace: WorkspacePayload,
  commands: MutationCommand[],
) {
  const rootIds = new Set(
    workspace.graph.nodes
      .filter((node) => node.rank === 1)
      .map((node) => node.id),
  );
  let syntheticRootCount = 0;

  commands.forEach((command) => {
    if (command.type === "delete_node") {
      rootIds.delete(command.node_id);
      return;
    }

    if (
      (command.type === "update_node" || command.type === "move_node") &&
      command.rank !== undefined
    ) {
      if (command.rank === 1 && !rootIds.has(command.node_id) && rootIds.size > 0) {
        throw new QonyApiError(
          "Only one Rank 1 root node is allowed in a workspace.",
          422,
        );
      }

      if (command.rank === 1) {
        rootIds.add(command.node_id);
      } else {
        rootIds.delete(command.node_id);
      }

      return;
    }

    if (command.type === "add_node" && command.node.rank === 1) {
      if (rootIds.size > 0) {
        throw new QonyApiError(
          "Only one Rank 1 root node is allowed in a workspace.",
          422,
        );
      }

      rootIds.add(command.node.id ?? `pending-root-${syntheticRootCount}`);
      syntheticRootCount += 1;
    }
  });
}

function applyWorkspaceCommands(
  workspace: WorkspacePayload,
  commands: MutationCommand[],
): WorkspacePayload {
  assertSingleRootConstraint(workspace, commands);

  let currentGraph = clone(workspace.graph);
  const now = nowIso();

  commands.forEach((command) => {
    switch (command.type) {
      case "add_node": {
        const node = command.node;
        currentGraph.nodes.push({
          id: node.id ?? nextId("node"),
          rank: node.rank,
          kind: slugify(node.title) || `rank-${node.rank}`,
          title: node.title,
          content: node.content ?? null,
          source: node.source ?? "manual",
          position: node.position ?? { x: (node.rank - 1) * 320, y: 0 },
          metadata: node.metadata ?? {},
          created_at: now,
          updated_at: now,
        });
        break;
      }
      case "update_node": {
        currentGraph.nodes = currentGraph.nodes.map((node) =>
          node.id === command.node_id
            ? {
                ...node,
                rank: command.rank ?? node.rank,
                title: command.title ?? node.title,
                content:
                  command.content !== undefined ? command.content : node.content,
                source: command.source ?? node.source,
                position: command.position ?? node.position,
                metadata:
                  command.merge_metadata && command.metadata
                    ? { ...node.metadata, ...command.metadata }
                    : (command.metadata ?? node.metadata),
                updated_at: now,
              }
            : node,
        );
        break;
      }
      case "delete_node": {
        currentGraph.nodes = currentGraph.nodes.filter(
          (node) => node.id !== command.node_id,
        );
        currentGraph.edges = currentGraph.edges.filter(
          (edge) =>
            edge.source !== command.node_id && edge.target !== command.node_id,
        );
        break;
      }
      case "add_edge": {
        const edgeExists = currentGraph.edges.some(
          (edge) =>
            edge.source === command.edge.source && edge.target === command.edge.target,
        );
        if (!edgeExists) {
          currentGraph.edges.push({
            id: command.edge.id ?? nextId("edge"),
            source: command.edge.source,
            target: command.edge.target,
            label: command.edge.label ?? null,
            metadata: command.edge.metadata ?? {},
            created_at: now,
            updated_at: now,
          });
        }
        break;
      }
      case "delete_edge": {
        currentGraph.edges = currentGraph.edges.filter((edge) => {
          if (command.edge_id) {
            return edge.id !== command.edge_id;
          }
          return !(
            edge.source === command.source && edge.target === command.target
          );
        });
        break;
      }
      case "move_node": {
        currentGraph.nodes = currentGraph.nodes.map((node) =>
          node.id === command.node_id
            ? {
                ...node,
                rank: command.rank ?? node.rank,
                position: command.position ?? node.position,
                updated_at: now,
              }
            : node,
        );
        break;
      }
      case "apply_ai_patch": {
        if (command.commands) {
          currentGraph = applyWorkspaceCommands(
            {
              ...workspace,
              graph: currentGraph,
            },
            command.commands,
          ).graph;
        }
        break;
      }
      default:
        break;
    }
  });

  const nextWorkspace = rebuildWorkspaceGraph(workspace, currentGraph);
  return nextWorkspace;
}

function createChatMessage({
  role,
  content,
  graphVersion,
  appliedCommands,
  createdAt,
  metadata,
}: {
  role: WorkspaceChatMessage["role"];
  content: string;
  graphVersion: number;
  appliedCommands: string[];
  createdAt: string;
  metadata?: Record<string, unknown>;
}): WorkspaceChatMessage {
  return {
    id: nextId(role),
    role,
    content,
    graph_version: graphVersion,
    applied_commands: appliedCommands,
    ai_request_id: role === "assistant" ? nextId("ai") : null,
    metadata: metadata ?? {},
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function buildIngestWorkspace(
  project: ProjectDetail,
  input: IngestRequest,
): WorkspacePayload {
  const text =
    input.raw_text.trim() ||
    "Uploaded material captured. Build the structured graph from the extracted evidence.";
  const focusSentence = text.split(/[.!?]/).find(Boolean)?.trim() ?? project.name;
  const branchIndexA = 0;
  const branchIndexB = 1;
  const timestamp = nowIso();

  const graph: WorkspaceGraph = {
    nodes: [
      createGraphNode({
        id: nextId("problem"),
        rank: 1,
        title: focusSentence,
        content: text.slice(0, 220),
        source: "ingest",
        createdAt: timestamp,
        updatedAt: timestamp,
        offset: 0,
      }),
      createGraphNode({
        id: nextId("sub"),
        rank: 2,
        title: "Core demand-side drivers",
        content: "Capture the demand-side dynamics surfaced by the source material.",
        source: "ingest",
        createdAt: timestamp,
        updatedAt: timestamp,
        branchIndex: branchIndexA,
        offset: 1,
      }),
      createGraphNode({
        id: nextId("sub"),
        rank: 2,
        title: "Operating model and capability gaps",
        content: "Trace the internal execution issues implied by the source material.",
        source: "ingest",
        createdAt: timestamp,
        updatedAt: timestamp,
        branchIndex: branchIndexB,
        offset: 2,
      }),
    ],
    edges: [],
    metadata: {
      project_id: project.id,
      workspace_id: project.workspace_id,
      version: 1,
      updated_at: timestamp,
      validation: {
        is_valid: true,
        issues: [],
        reachable_node_count: 0,
        complete_branch_count: 0,
      },
      attributes: {},
    },
  };

  const root = graph.nodes[0];
  const firstSub = graph.nodes[1];
  const secondSub = graph.nodes[2];

  graph.edges = [
    createGraphEdge({ source: root.id, target: firstSub.id }, timestamp, 0),
    createGraphEdge({ source: root.id, target: secondSub.id }, timestamp, 1),
  ];
  graph.metadata = buildGraphMetadata(project.id, project.workspace_id, graph.nodes, graph.edges, {
    ingest_mode: "mock-parser",
    source_filename: input.source_filename ?? null,
    provider_attempted: "mock-parser",
    extracted_summary: focusSentence,
  });

  return {
    project_id: project.id,
    workspace_id: project.workspace_id,
    graph,
    chat: {
      messages: [
        createChatMessage({
          role: "assistant",
          content:
            "Ingest completed. I created the initial problem framing and two branch candidates. Expand the hypotheses and connect evidence before exporting.",
          graphVersion: graph.metadata.version,
          appliedCommands: ["add_node", "add_edge"],
          createdAt: timestamp,
          metadata: {
            provider: "mock-parser",
            action: "ingest_seed",
            response_payload: {
              follow_up: "Expand branch detail from the right-side copilot.",
              seeded_node_ids: graph.nodes.map((node) => node.id),
            },
          },
        }),
      ],
    },
  };
}

function appendIngestToWorkspace(
  project: ProjectDetail,
  workspace: WorkspacePayload,
  input: IngestRequest,
): WorkspacePayload {
  if (!workspace.graph.metadata.validation.is_valid) {
    throw new QonyApiError(
      "The current workspace has validation issues. Repair it first or enable replace existing.",
      409,
    );
  }

  const root = workspace.graph.nodes.find((node) => node.rank === 1);
  if (!root) {
    throw new QonyApiError(
      "The current workspace does not have a Rank 1 root. Repair it first or enable replace existing.",
      409,
    );
  }

  const text =
    input.raw_text.trim() ||
    "Uploaded material captured. Build the structured graph from the extracted evidence.";
  const focusSentence = text.split(/[.!?]/).find(Boolean)?.trim() ?? project.name;
  const timestamp = nowIso();
  const nextBranchIndex =
    Math.max(
      -1,
      ...workspace.graph.nodes.map((node) => readBranchIndex(node.metadata.branch_index)),
    ) + 1;
  const appendedNodes = [
    createGraphNode({
      id: nextId("sub"),
      rank: 2,
      title: "Fresh source signal from ingest",
      content: focusSentence,
      source: "ingest",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: nextBranchIndex,
      offset: workspace.graph.nodes.length,
    }),
    createGraphNode({
      id: nextId("sub"),
      rank: 2,
      title: "Follow-up investigation branch",
      content:
        "Preserve the current graph and use this branch to unpack the newly ingested material.",
      source: "ingest",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: nextBranchIndex + 1,
      offset: workspace.graph.nodes.length + 1,
    }),
  ];
  const appendedEdges = appendedNodes.map((node, index) =>
    createGraphEdge(
      { source: root.id, target: node.id },
      timestamp,
      workspace.graph.edges.length + index,
    ),
  );
  const nextGraph: WorkspaceGraph = {
    ...workspace.graph,
    nodes: [...workspace.graph.nodes, ...appendedNodes],
    edges: [...workspace.graph.edges, ...appendedEdges],
    metadata: buildGraphMetadata(
      workspace.project_id,
      workspace.workspace_id,
      [...workspace.graph.nodes, ...appendedNodes],
      [...workspace.graph.edges, ...appendedEdges],
      {
        ...workspace.graph.metadata.attributes,
        ingest_mode: "mock-parser",
        last_ingest_mode: "append",
        source_filename: input.source_filename ?? null,
        provider_attempted: "mock-parser",
        extracted_summary: focusSentence,
      },
      workspace.graph.metadata.version + 1,
    ),
  };

  return {
    ...workspace,
    graph: nextGraph,
    chat: {
      messages: [
        ...workspace.chat.messages,
        createChatMessage({
          role: "assistant",
          content:
            "Ingest completed without replacing the existing graph. I added two new Rank 2 branches under the current root so you can merge the new material into the active case.",
          graphVersion: nextGraph.metadata.version,
          appliedCommands: ["add_node", "add_edge"],
          createdAt: timestamp,
          metadata: {
            provider: "mock-parser",
            action: "ingest_append",
            response_payload: {
              appended_node_ids: appendedNodes.map((node) => node.id),
            },
          },
        }),
      ],
    },
  };
}

function buildAssistantPatch(
  workspace: WorkspacePayload,
  request: WorkspaceChatRequest,
) {
  const lowerMessage = request.message.toLowerCase();
  const commands: MutationCommand[] = [];

  const firstRank2 = workspace.graph.nodes.find((node) => node.rank === 2) ?? null;
  const firstRank3 = workspace.graph.nodes.find((node) => node.rank === 3) ?? null;
  const firstRank4 = workspace.graph.nodes.find((node) => node.rank === 4) ?? null;

  if (lowerMessage.includes("hypothesis") && firstRank2) {
    const newNodeId = nextId("hypothesis");
    commands.push({
      type: "add_node",
      node: {
        id: newNodeId,
        rank: 3,
        title: "New AI-generated hypothesis",
        content:
          "This hypothesis was added by the mock copilot to extend the selected sub-problem branch.",
        source: "ai",
        position: {
          x: 640,
          y: 220,
        },
        metadata: {
          branch_index: firstRank2.metadata.branch_index ?? 0,
        },
      },
    } satisfies AddNodeCommand);
    commands.push({
      type: "add_edge",
      edge: {
        source: firstRank2.id,
        target: newNodeId,
      },
    } satisfies AddEdgeCommand);
  }

  if (lowerMessage.includes("evidence") || lowerMessage.includes("data")) {
    const parent = firstRank4 ?? workspace.graph.nodes.find((node) => node.rank === 3) ?? null;
    if (parent) {
      const nextRank = getNextRank(parent.rank);
      if (nextRank) {
        const newNodeId = nextId("evidence");
        commands.push({
          type: "add_node",
          node: {
            id: newNodeId,
            rank: nextRank,
            title: "AI-suggested evidence pack",
            content:
              "Mock evidence block summarizing what to collect next for this branch.",
            source: "ai",
            position: {
              x: parent.position.x + 320,
              y: parent.position.y + 32,
            },
            metadata: {
              branch_index: parent.metadata.branch_index ?? 0,
            },
          },
        } satisfies AddNodeCommand);
        commands.push({
          type: "add_edge",
          edge: {
            source: parent.id,
            target: newNodeId,
          },
        } satisfies AddEdgeCommand);
      }
    }
  }

  if (
    (lowerMessage.includes("framework") || lowerMessage.includes("analysis")) &&
    firstRank3
  ) {
    const newNodeId = nextId("framework");
    commands.push({
      type: "add_node",
      node: {
        id: newNodeId,
        rank: 4,
        title: "AI-recommended framework",
        content:
          "Recommended framework: Driver Tree.\n\nUse this branch to decompose the hypothesis into measurable drivers, prioritize the largest gap, and define the evidence required to confirm it.",
        source: "ai",
        position: {
          x: firstRank3.position.x + 320,
          y: firstRank3.position.y,
        },
        metadata: {
          branch_index: firstRank3.metadata.branch_index ?? 0,
        },
      },
    } satisfies AddNodeCommand);
    commands.push({
      type: "add_edge",
      edge: {
        source: firstRank3.id,
        target: newNodeId,
      },
    } satisfies AddEdgeCommand);
  }

  if (lowerMessage.includes("synthesis")) {
    const parent = workspace.graph.nodes.find((node) => node.rank === 5) ?? null;
    if (parent) {
      const newNodeId = nextId("synthesis");
      commands.push({
        type: "add_node",
        node: {
          id: newNodeId,
          rank: 6,
          title: "AI draft synthesis",
          content:
            "The mock copilot generated a first-pass synthesis. Tighten the conclusion and export once the branch is complete.",
          source: "ai",
          position: {
            x: parent.position.x + 320,
            y: parent.position.y,
          },
          metadata: {
            branch_index: parent.metadata.branch_index ?? 0,
          },
        },
      } satisfies AddNodeCommand);
      commands.push({
        type: "add_edge",
        edge: {
          source: parent.id,
          target: newNodeId,
        },
      } satisfies AddEdgeCommand);
    }
  }

  return commands;
}

function buildFrameworkAwareMockResponse(
  workspace: WorkspacePayload,
  request: WorkspaceChatRequest,
) {
  const framework = detectFrameworkFromText(request.message);
  if (!framework) {
    return null;
  }

  const context = resolveFrameworkRecommendationContext(
    request.selected_node_id ?? null,
    workspace.graph.nodes,
    workspace.graph.edges,
  );
  if (!context) {
    return {
      commands: [] as MutationCommand[],
      summary:
        "Tambahkan atau pilih dulu satu hypothesis branch supaya framework bisa diterapkan dengan konteks yang tepat.",
    };
  }

  const suggestion = buildFrameworkSuggestion(context.anchorNode, framework);
  const lower = request.message.toLowerCase();
  const wantsGraphMutation =
    /(add|apply|buat|tambahkan|masukkan|masukin|taruh|pakai|use)/.test(lower) &&
    /(graph|canvas|node|rank 4|framework)/.test(lower);

  if (!wantsGraphMutation) {
    return {
      commands: [] as MutationCommand[],
      summary: suggestion.content,
    };
  }

  const targetFrameworkNode = context.existingFrameworkNode;
  if (targetFrameworkNode) {
    return {
      commands: [
        {
          type: "update_node",
          node_id: targetFrameworkNode.id,
          title: suggestion.title,
          content: suggestion.content,
          source: "ai",
          metadata: {
            framework_key: suggestion.id,
            recommended_for: context.anchorNode.id,
          },
          merge_metadata: true,
        },
      ] satisfies MutationCommand[],
      summary: `Saya apply ${suggestion.title} ke framework node yang sedang aktif.`,
    };
  }

  const newNodeId = nextId("framework");
  return {
    commands: [
      {
        type: "add_node",
        node: {
          id: newNodeId,
          rank: 4,
          title: suggestion.title,
          content: suggestion.content,
          source: "ai",
          position: {
            x: context.anchorNode.position.x + 320,
            y: context.anchorNode.position.y,
          },
          metadata: {
            branch_index: context.anchorNode.metadata.branch_index ?? 0,
            framework_key: suggestion.id,
            recommended_for: context.anchorNode.id,
          },
        },
      } satisfies AddNodeCommand,
      {
        type: "add_edge",
        edge: {
          source: context.anchorNode.id,
          target: newNodeId,
        },
      } satisfies AddEdgeCommand,
    ],
    summary: `Saya tambahkan ${suggestion.title} sebagai Rank 4 framework untuk branch "${context.anchorNode.title}".`,
  };
}

export function resetMockDatabase() {
  mockDatabase = createInitialDatabase();
}

export async function mockListProjects(): Promise<ApiResponse<ProjectListPayload>> {
  const items = Object.values(mockDatabase.projects)
    .map(buildProjectSummary)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));

  return { data: { items } };
}

export async function mockCreateProject(
  payload: ProjectCreateRequest,
): Promise<ApiResponse<ProjectDetail>> {
  const timestamp = nowIso();
  const projectId = slugify(payload.name) || nextId("project");
  if (mockDatabase.projects[projectId]) {
    throw new QonyApiError(
      `A project named "${payload.name}" already exists. Use a different name instead of overwriting the current case.`,
      409,
    );
  }
  const workspaceId = `workspace-${projectId}`;
  const project: ProjectDetail = {
    id: projectId,
    workspace_id: workspaceId,
    name: payload.name,
    description: payload.description ?? "",
    status: "draft",
    metadata: payload.metadata ?? {},
    created_at: timestamp,
    updated_at: timestamp,
    user_email: "demo@qony.ai",
    user_name: "Qony Demo",
  };

  mockDatabase.projects[projectId] = project;
  mockDatabase.workspaces[projectId] = {
    project_id: projectId,
    workspace_id: workspaceId,
    graph: {
      nodes: [],
      edges: [],
      metadata: buildGraphMetadata(projectId, workspaceId, [], [], {
        ingest_mode: "manual",
        provider_attempted: "mock-engine",
      }),
    },
    chat: { messages: [] },
  };

  return { data: clone(project) };
}

export async function mockGetProject(
  projectId: string,
): Promise<ApiResponse<ProjectDetail>> {
  return { data: clone(readProject(projectId)) };
}

export async function mockUpdateProject(
  projectId: string,
  payload: ProjectUpdateRequest,
): Promise<ApiResponse<ProjectDetail>> {
  const current = readProject(projectId);
  const nextProject: ProjectDetail = {
    ...current,
    name: payload.name ?? current.name,
    description: payload.description ?? current.description,
    status: payload.status ?? current.status,
    metadata: payload.metadata ?? current.metadata,
    updated_at: nowIso(),
  };
  mockDatabase.projects[projectId] = nextProject;
  return { data: clone(nextProject) };
}

export async function mockDeleteProject(
  projectId: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  delete mockDatabase.projects[projectId];
  delete mockDatabase.workspaces[projectId];
  return { data: { deleted: true } };
}

export async function mockIngestProject(
  payload: IngestRequest,
): Promise<ApiResponse<IngestPayload>> {
  const project = readProject(payload.project_id);
  const currentWorkspace = readWorkspace(payload.project_id);
  const shouldReplace =
    payload.replace_existing === true || currentWorkspace.graph.nodes.length === 0;
  const workspace = shouldReplace
    ? buildIngestWorkspace(project, payload)
    : appendIngestToWorkspace(project, currentWorkspace, payload);
  mockDatabase.workspaces[payload.project_id] = workspace;
  mockDatabase.projects[payload.project_id] = {
    ...project,
    updated_at: workspace.graph.metadata.updated_at,
    status:
      workspace.graph.metadata.validation.is_valid && project.status !== "archived"
        ? "active"
        : project.status,
  };

  return {
    data: {
      job: {
        id: nextId("job"),
        project_id: project.id,
        workspace_id: project.workspace_id,
        requested_by_user_id: "demo-user",
        status: "completed",
        provider: "mock-parser",
        model: "qony-mock-v1",
        fallback_used: false,
        created_at: workspace.graph.metadata.updated_at,
        updated_at: workspace.graph.metadata.updated_at,
      },
      graph: clone(workspace.graph),
    },
  };
}

export async function mockGetWorkspace(
  projectId: string,
): Promise<ApiResponse<WorkspacePayload>> {
  return { data: clone(readWorkspace(projectId)) };
}

export async function mockMutateWorkspace(
  payload: WorkspaceMutationRequest,
): Promise<ApiResponse<WorkspaceMutationResult>> {
  const currentWorkspace = readWorkspace(payload.project_id);
  assertExpectedVersion(currentWorkspace, payload.expected_version);
  const nextWorkspace = updateWorkspace(payload.project_id, (workspace) =>
    applyWorkspaceCommands(workspace, payload.commands),
  );

  return {
    data: {
      project_id: nextWorkspace.project_id,
      workspace_id: nextWorkspace.workspace_id,
      graph: clone(nextWorkspace.graph),
      applied_commands: payload.commands.map((command) => command.type),
      ai_commands_applied: payload.commands.filter((command) =>
        command.type.startsWith("apply_ai"),
      ).length,
      ai_request_id: null,
    },
  };
}

export async function mockChatWorkspace(
  payload: WorkspaceChatRequest,
): Promise<ApiResponse<WorkspaceChatResponse>> {
  const workspace = readWorkspace(payload.project_id);
  assertExpectedVersion(workspace, payload.expected_version);
  const frameworkResponse = buildFrameworkAwareMockResponse(workspace, payload);
  const commands = frameworkResponse?.commands ?? buildAssistantPatch(workspace, payload);
  const updatedWorkspace = updateWorkspace(payload.project_id, (currentWorkspace) => {
    const nextGraphWorkspace =
      commands.length > 0
        ? applyWorkspaceCommands(currentWorkspace, commands)
        : clone(currentWorkspace);
    const createdAt = nowIso();
    const assistantSummary =
      frameworkResponse?.summary ??
      (commands.length > 0
        ? `I applied ${commands.length} graph change${commands.length > 1 ? "s" : ""} from your prompt and refreshed the branch structure.`
        : "I reviewed the branch. No structural changes were applied, but the next step is to strengthen the weakest rank transition with new evidence or synthesis.");

    return {
      ...nextGraphWorkspace,
      chat: {
        messages: [
          ...currentWorkspace.chat.messages,
          createChatMessage({
            role: "user",
            content: payload.message,
            graphVersion: currentWorkspace.graph.metadata.version,
            appliedCommands: [],
            createdAt,
          }),
          createChatMessage({
            role: "assistant",
            content: assistantSummary,
            graphVersion: nextGraphWorkspace.graph.metadata.version,
            appliedCommands: commands.map((command) => command.type),
            createdAt,
            metadata: {
              action: "mock_patch",
              provider: "qony-mock-copilot",
              request_payload: {
                message: payload.message,
                expected_version: payload.expected_version,
              },
              response_payload: {
                applied_commands: commands.map((command) => command.type),
              },
            },
          }),
        ],
      },
    };
  });

  const assistantMessage =
    updatedWorkspace.chat.messages[updatedWorkspace.chat.messages.length - 1];

  return {
    data: {
      project_id: updatedWorkspace.project_id,
      workspace_id: updatedWorkspace.workspace_id,
      graph: clone(updatedWorkspace.graph),
      chat: clone(updatedWorkspace.chat),
      assistant_message: clone(assistantMessage),
      applied_commands: commands.map((command) => command.type),
      ai_commands_applied: commands.length,
      ai_request_id: assistantMessage.ai_request_id,
    },
  };
}

export async function mockGetExportPreview(
  projectId: string,
): Promise<ApiResponse<ExportPreviewPayload>> {
  return { data: buildExportPreview(readWorkspace(projectId)) };
}

export function getMockWorkspace(projectId: string) {
  return clone(readWorkspace(projectId));
}
