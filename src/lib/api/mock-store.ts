import {
  type AddEdgeCommand,
  type AddNodeCommand,
  type ApiResponse,
  type DeliverableType,
  type EdgeRelationType,
  type ExportSlidePlan,
  type ExportPreviewPayload,
  type GraphEdge,
  type GraphMetadata,
  type GraphNode,
  type GraphValidationIssue,
  type GraphValidationSummary,
  type IngestPayload,
  type IngestRequest,
  type MutationCommand,
  type NodeSource,
  type NodeType,
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
import { getColumnX, readBranchIndex } from "@/src/lib/workspace/graph-layout";
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
    type: NodeType;
    title: string;
    description: string;
    branchIndex?: number;
  }>;
  edges: Array<{ source: string; target: string; type?: EdgeRelationType }>;
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
        type: "problem",
        title: "Why is revenue quality deteriorating despite traffic growth?",
        description:
          "The executive team needs a branch-level explanation for margin pressure before planning the 2026 budget.",
      },
      {
        id: "p2",
        type: "problem",
        title: "Traffic-to-basket conversion weakness",
        description:
          "Footfall is up, but customers are buying fewer high-margin items per visit.",
        branchIndex: 0,
      },
      {
        id: "p3",
        type: "problem",
        title: "Promotion mix is diluting profitability",
        description:
          "Discount-led acquisition is pulling demand forward while training buyers to wait for promotions.",
        branchIndex: 1,
      },
      {
        id: "p4",
        type: "assumption",
        title: "Assortment gaps reduce attachment purchases",
        description:
          "Stores with weak category adjacency are converting traffic into smaller baskets.",
        branchIndex: 0,
      },
      {
        id: "p5",
        type: "assumption",
        title: "Blanket discounting is cannibalizing full-price demand",
        description:
          "High-frequency discounting shifts sales into promo windows without materially expanding the customer base.",
        branchIndex: 1,
      },
      {
        id: "p6",
        type: "solution",
        title: "Compare basket mix by store archetype",
        description:
          "Segment stores by traffic growth, attachment-rate trend, and adjacent category availability.",
        branchIndex: 0,
      },
      {
        id: "p7",
        type: "solution",
        title: "Model incremental margin from promotion cohorts",
        description:
          "Estimate gross margin impact by campaign, customer segment, and reversion to full-price buying behavior.",
        branchIndex: 1,
      },
      {
        id: "p8",
        type: "evidence",
        title: "Category adjacency audit shows 14-point basket gap",
        description:
          "Stores missing three or more complementary categories underperform on average basket value by 14%.",
        branchIndex: 0,
      },
      {
        id: "p9",
        type: "evidence",
        title: "Promo cohort analysis shows low post-campaign retention",
        description:
          "Customers acquired through blanket markdowns have lower 90-day retention and lower full-price recovery.",
        branchIndex: 1,
      },
      {
        id: "p10",
        type: "objective",
        title: "Refocus growth on basket quality, not pure traffic",
        description:
          "Prioritize assortment repair in high-traffic stores and replace blanket markdowns with narrower, segment-led offers.",
        branchIndex: 0,
      },
      {
        id: "p11",
        type: "objective",
        title: "Promotions need margin guardrails",
        description:
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
      { source: "p6", target: "p8", type: "supports" },
      { source: "p7", target: "p9", type: "supports" },
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
        type: "problem",
        title: "Which customer segment creates the fastest path to repeat usage?",
        description:
          "We need a realistic wedge that proves value quickly and creates strong expansion economics.",
      },
      {
        id: "m2",
        type: "problem",
        title: "Consulting teams handling strategy cases",
        description:
          "Teams already operate with structured logic trees and benefit from faster synthesis.",
        branchIndex: 0,
      },
      {
        id: "m3",
        type: "problem",
        title: "Corporate strategy and planning teams",
        description:
          "Internal teams need cross-functional evidence gathering and reusable strategic narratives.",
        branchIndex: 1,
      },
      {
        id: "m4",
        type: "assumption",
        title: "Consulting teams have higher workflow urgency",
        description:
          "Billable case cycles make time savings immediately valuable and visible.",
        branchIndex: 0,
      },
      {
        id: "m5",
        type: "assumption",
        title: "Corporate teams have stickier longitudinal value",
        description:
          "Once embedded into planning rituals, the workspace becomes part of review and decision cadence.",
        branchIndex: 1,
      },
      {
        id: "m6",
        type: "solution",
        title: "Measure consulting ROI inside active case cycles",
        description:
          "Pilot teams can quantify time saved and show value within live engagements.",
        branchIndex: 0,
      },
      {
        id: "m7",
        type: "solution",
        title: "Map adoption triggers across planning cadences",
        description:
          "Recurring planning rituals create reuse, but rollout and change management move more slowly.",
        branchIndex: 1,
      },
      {
        id: "m8",
        type: "evidence",
        title: "Pilot teams show visible week-one time savings",
        description:
          "Early consulting pilots can demonstrate faster synthesis and clearer branch ownership within days.",
        branchIndex: 0,
      },
      {
        id: "m9",
        type: "evidence",
        title: "Planning teams show stronger long-run stickiness",
        description:
          "Internal strategy groups become sticky once templates and review rituals are in place, but the proof cycle is longer.",
        branchIndex: 1,
      },
      {
        id: "m10",
        type: "objective",
        title: "Start with consulting-style teams, then expand into internal strategy",
        description:
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
      { source: "m6", target: "m8", type: "supports" },
      { source: "m7", target: "m9", type: "supports" },
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
      type: node.type,
      title: node.title,
      description: node.description,
      source: seed.id === "case-empty-template" ? "user" : "document",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: node.branchIndex,
      offset: index,
    }),
  );

  const edges = seed.edges.map((edge, index) =>
    createGraphEdge(
      { source: edge.source, target: edge.target, type: edge.type ?? "related_to" },
      timestamp,
      index,
    ),
  );
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
  type,
  title,
  description,
  source,
  createdAt,
  updatedAt,
  branchIndex,
  offset,
  isEnrichment,
  sourceUrl,
  confidence,
}: {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  source: NodeSource;
  createdAt: string;
  updatedAt: string;
  branchIndex?: number;
  offset: number;
  isEnrichment?: boolean;
  sourceUrl?: string | null;
  confidence?: number;
}): GraphNode {
  return {
    id,
    type,
    title,
    description,
    source,
    is_enrichment: isEnrichment ?? false,
    source_url: sourceUrl ?? null,
    confidence: confidence ?? 1,
    position: {
      x: getColumnX(type),
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
  edge: { source: string; target: string; type?: EdgeRelationType },
  timestamp: string,
  index: number,
): GraphEdge {
  return {
    id: `edge-${index}-${edge.source}-${edge.target}`,
    type: edge.type ?? "related_to",
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
  const roots = nodes.filter((node) => node.type === "problem");
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

    if (edge.type === "supports" && target.source === "web" && !target.source_url) {
      issues.push({
        code: "invalid_web_enrichment",
        message:
          "Web-enriched nodes must include a source_url. Attach the source URL before exporting.",
        node_id: target.id,
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
      code: "missing_problem",
      message: "A valid workspace needs at least one problem node.",
    });
  }

  nodes.forEach((node) => {
    if (node.type === "problem") {
      return;
    }
    if (!edges.some((edge) => edge.target === node.id || edge.source === node.id)) {
      issues.push({
        code: "orphan_node",
        message: "Node is disconnected from the main logic tree.",
        node_id: node.id,
      });
    }
  });

  return {
    is_valid: issues.length === 0,
    issues,
    reachable_node_count: reachable.size,
    complete_branch_count: issues.length === 0 ? nodes.length : 0,
  };
}

function summarizeValidationIssues(issues: GraphValidationIssue[]) {
  return issues
    .slice(0, 2)
    .map((issue) => issue.message)
    .join(" ");
}

function buildMockSlidePlan(
  workspace: WorkspacePayload,
  deliverableType: DeliverableType,
): ExportSlidePlan {
  const nodes = workspace.graph.nodes;
  const project = readProject(workspace.project_id);
  const problem = nodes.find((node) => node.type === "problem");
  const solution = nodes.find(
    (node) =>
      node.type === "solution" ||
      node.type === "objective" ||
      node.type === "opportunity",
  );
  const evidence = nodes.find(
    (node) =>
      node.type === "evidence" ||
      node.type === "metric" ||
      node.type === "market_data" ||
      node.type === "trend",
  );
  const riskNodes = nodes.filter(
    (node) => node.type === "risk" || node.type === "constraint",
  );

  if (deliverableType === "pitch_deck") {
    return {
      deliverable_type: deliverableType,
      manifest_version: "mock-0.1.0",
      warnings: [],
      steps: [
        {
          component_key: "pitch_deck.cover",
          title: project.name,
          source_node_ids: problem ? [problem.id] : [],
          variables: {
            title: project.name,
            tagline:
              project.description ||
              problem?.title ||
              "Structured export generated from the mock workspace.",
            author: "Qony mock",
            date: nowIso().slice(0, 10),
          },
        },
        {
          component_key: "pitch_deck.problem",
          title: problem?.title || "Problem framing",
          source_node_ids: problem ? [problem.id] : [],
          variables: {
            main_problem:
              problem?.title || "Problem statement is not defined yet.",
            sub_points: nodes
              .filter(
                (node) =>
                  node.id !== problem?.id &&
                  (node.type === "problem" ||
                    node.type === "assumption" ||
                    node.type === "risk"),
              )
              .slice(0, 4)
              .map((node) => node.title),
            statistic: evidence
              ? `${evidence.title}: ${evidence.description}`
              : null,
          },
        },
        {
          component_key: "pitch_deck.solution",
          title: solution?.title || "Recommended approach",
          source_node_ids: solution ? [solution.id] : [],
          variables: {
            headline: solution?.title || "Recommendation is not defined yet.",
            description:
              solution?.description ||
              "Add solution or objective nodes to strengthen the narrative.",
            key_points: nodes
              .filter(
                (node) =>
                  node.id !== solution?.id &&
                  (node.type === "solution" ||
                    node.type === "objective" ||
                    node.type === "opportunity"),
              )
              .slice(0, 4)
              .map((node) => node.title),
          },
        },
        {
          component_key: "pitch_deck.closing",
          title: "Next decision checkpoint",
          source_node_ids: [],
          variables: {
            headline: "Ready for review and export.",
            ask:
              solution?.description ||
              "Confirm the strongest branch and generate the next export revision.",
            contact: "mock@qony.ai",
          },
        },
      ],
    };
  }

  return {
    deliverable_type: deliverableType,
    manifest_version: "mock-0.1.0",
    warnings: [],
    steps: [
      {
        component_key: "business_document.executive_summary",
        title: "Executive summary",
        source_node_ids: [problem?.id, solution?.id].filter(Boolean) as string[],
        variables: {
          title: "Executive summary",
          summary:
            project.description ||
            solution?.description ||
            "Mock export summary generated from the current workspace.",
          highlights: nodes.slice(0, 4).map((node) => node.title),
        },
      },
      {
        component_key: "business_document.problem_analysis",
        title: problem?.title || "Problem analysis",
        source_node_ids: problem ? [problem.id] : [],
        variables: {
          title: problem?.title || "Problem analysis",
          body:
            problem?.description ||
            "The mock workspace does not yet include a fully-defined problem analysis.",
          evidence: evidence ? [`${evidence.title}: ${evidence.description}`] : [],
        },
      },
      {
        component_key: "business_document.recommendation",
        title: solution?.title || "Recommendation",
        source_node_ids: solution ? [solution.id] : [],
        variables: {
          title: solution?.title || "Recommendation",
          body:
            solution?.description ||
            "Add solution nodes to complete the recommendation section.",
          next_steps: nodes
            .filter(
              (node) =>
                node.id !== solution?.id &&
                (node.type === "objective" ||
                  node.type === "opportunity" ||
                  node.type === "resource"),
            )
            .slice(0, 4)
            .map((node) => node.title),
        },
      },
      {
        component_key: "business_document.risk_register",
        title: "Risk register",
        source_node_ids: riskNodes.map((node) => node.id),
        variables: {
          title: "Risk register",
          risks:
            riskNodes.length > 0
              ? riskNodes.slice(0, 5).map((node) => ({
                  title: node.title,
                  description: node.description,
                  mitigation: null,
                }))
              : [
                  {
                    title: "Sparse workspace coverage",
                    description:
                      "The current mock workspace does not include explicit risk nodes.",
                    mitigation:
                      "Add risk or constraint nodes before sharing the export externally.",
                  },
                ],
        },
      },
    ],
  };
}

function buildExportPreview(
  workspace: WorkspacePayload,
  deliverableType: DeliverableType = "pitch_deck",
): ExportPreviewPayload {
  const validation = workspace.graph.metadata.validation;
  const warnings = [
    ...(!validation.is_valid
      ? [
          `Resolve workspace validation issues before exporting. ${summarizeValidationIssues(validation.issues)}`.trim(),
        ]
      : []),
    ...(workspace.graph.nodes.length === 0
      ? ["Workspace is empty. Seed at least one problem node before exporting."]
      : []),
  ];
  const slidePlan = buildMockSlidePlan(workspace, deliverableType);

  return {
    snapshot_id: `snapshot-${workspace.project_id}-${workspace.graph.metadata.version}`,
    project_id: workspace.project_id,
    workspace_id: workspace.workspace_id,
    project_name: readProject(workspace.project_id).name,
    generated_at: nowIso(),
    graph_version: workspace.graph.metadata.version,
    deliverable_type: deliverableType,
    manifest_version: slidePlan.manifest_version,
    slide_plan: slidePlan,
    status: "ready",
    warnings: [...warnings, ...slidePlan.warnings],
  };
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

function applyWorkspaceCommands(
  workspace: WorkspacePayload,
  commands: MutationCommand[],
): WorkspacePayload {
  let currentGraph = clone(workspace.graph);
  const now = nowIso();

  commands.forEach((command) => {
    switch (command.type) {
      case "add_node": {
        const node = command.node;
        currentGraph.nodes.push({
          id: node.id ?? nextId("node"),
          type: node.type,
          title: node.title,
          description: node.description,
          source: node.source ?? "user",
          is_enrichment: node.is_enrichment ?? false,
          source_url: node.source_url ?? null,
          confidence: node.confidence ?? 1,
          position: node.position ?? { x: getColumnX(node.type), y: 0 },
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
                type: command.node_type ?? node.type,
                title: command.title ?? node.title,
                description:
                  command.description !== undefined
                    ? command.description
                    : node.description,
                source: command.source ?? node.source,
                is_enrichment:
                  command.is_enrichment !== undefined
                    ? command.is_enrichment
                    : node.is_enrichment,
                source_url:
                  command.source_url !== undefined
                    ? command.source_url
                    : node.source_url,
                confidence:
                  command.confidence !== undefined
                    ? command.confidence
                    : node.confidence,
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
            type: command.edge.type,
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
                position: command.position,
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

  const nodes: GraphNode[] = [
    createGraphNode({
      id: nextId("problem"),
      type: "problem",
      title: focusSentence,
      description: text.slice(0, 220),
      source: "document",
      createdAt: timestamp,
      updatedAt: timestamp,
      offset: 0,
    }),
    createGraphNode({
      id: nextId("sub"),
      type: "problem",
      title: "Core demand-side drivers",
      description: "Capture the demand-side dynamics surfaced by the source material.",
      source: "document",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: branchIndexA,
      offset: 1,
    }),
    createGraphNode({
      id: nextId("sub"),
      type: "problem",
      title: "Operating model and capability gaps",
      description: "Trace the internal execution issues implied by the source material.",
      source: "document",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: branchIndexB,
      offset: 2,
    }),
  ];

  const root = nodes[0];
  const firstSub = nodes[1];
  const secondSub = nodes[2];

  const edges: GraphEdge[] = [
    createGraphEdge({ source: root.id, target: firstSub.id }, timestamp, 0),
    createGraphEdge({ source: root.id, target: secondSub.id }, timestamp, 1),
  ];

  const metadata = buildGraphMetadata(project.id, project.workspace_id, nodes, edges, {
    ingest_mode: "mock-parser",
    source_filename: input.source_filename ?? null,
    provider_attempted: "mock-parser",
    extracted_summary: focusSentence,
  });

  const graph: WorkspaceGraph = { nodes, edges, metadata };

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

  const root = workspace.graph.nodes.find((node) => node.type === "problem");
  if (!root) {
    throw new QonyApiError(
      "The current workspace does not have a problem node. Repair it first or enable replace existing.",
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
      type: "problem",
      title: "Fresh source signal from ingest",
      description: focusSentence,
      source: "document",
      createdAt: timestamp,
      updatedAt: timestamp,
      branchIndex: nextBranchIndex,
      offset: workspace.graph.nodes.length,
    }),
    createGraphNode({
      id: nextId("sub"),
      type: "problem",
      title: "Follow-up investigation branch",
      description:
        "Preserve the current graph and use this branch to unpack the newly ingested material.",
      source: "document",
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
            "Ingest completed without replacing the existing graph. I added two new sub-problem branches under the current root so you can merge the new material into the active case.",
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

  const firstProblem =
    workspace.graph.nodes.find(
      (node) => node.type === "problem" && node.metadata.branch_index !== undefined,
    ) ?? workspace.graph.nodes.find((node) => node.type === "problem") ?? null;
  const firstAssumption =
    workspace.graph.nodes.find((node) => node.type === "assumption") ?? null;
  const firstSolution =
    workspace.graph.nodes.find((node) => node.type === "solution") ?? null;
  const firstEvidence =
    workspace.graph.nodes.find((node) => node.type === "evidence") ?? null;

  if (lowerMessage.includes("hypothesis") && firstProblem) {
    const newNodeId = nextId("hypothesis");
    commands.push({
      type: "add_node",
      node: {
        id: newNodeId,
        type: "assumption",
        title: "New AI-generated hypothesis",
        description:
          "This hypothesis was added by the mock copilot to extend the selected sub-problem branch.",
        source: "user",
        position: {
          x: getColumnX("assumption"),
          y: 220,
        },
        metadata: {
          branch_index: firstProblem.metadata.branch_index ?? 0,
        },
      },
    } satisfies AddNodeCommand);
    commands.push({
      type: "add_edge",
      edge: {
        type: "related_to",
        source: firstProblem.id,
        target: newNodeId,
      },
    } satisfies AddEdgeCommand);
  }

  if (lowerMessage.includes("evidence") || lowerMessage.includes("data")) {
    const parent = firstSolution ?? firstAssumption;
    if (parent) {
      const newNodeId = nextId("evidence");
      commands.push({
        type: "add_node",
        node: {
          id: newNodeId,
          type: "evidence",
          title: "AI-suggested evidence pack",
          description:
            "Mock evidence block summarizing what to collect next for this branch.",
          source: "user",
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
          type: "supports",
          source: parent.id,
          target: newNodeId,
        },
      } satisfies AddEdgeCommand);
    }
  }

  if (
    (lowerMessage.includes("framework") || lowerMessage.includes("analysis")) &&
    firstAssumption
  ) {
    const newNodeId = nextId("framework");
    commands.push({
      type: "add_node",
      node: {
        id: newNodeId,
        type: "solution",
        title: "AI-recommended framework",
        description:
          "Recommended framework: Driver Tree.\n\nUse this branch to decompose the hypothesis into measurable drivers, prioritize the largest gap, and define the evidence required to confirm it.",
        source: "user",
        position: {
          x: firstAssumption.position.x + 320,
          y: firstAssumption.position.y,
        },
        metadata: {
          branch_index: firstAssumption.metadata.branch_index ?? 0,
        },
      },
    } satisfies AddNodeCommand);
    commands.push({
      type: "add_edge",
      edge: {
        type: "related_to",
        source: firstAssumption.id,
        target: newNodeId,
      },
    } satisfies AddEdgeCommand);
  }

  if (lowerMessage.includes("synthesis")) {
    const parent = firstEvidence ?? firstSolution;
    if (parent) {
      const newNodeId = nextId("synthesis");
      commands.push({
        type: "add_node",
        node: {
          id: newNodeId,
          type: "objective",
          title: "AI draft synthesis",
          description:
            "The mock copilot generated a first-pass synthesis. Tighten the conclusion and export once the branch is complete.",
          source: "user",
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
          type: "related_to",
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
    /(graph|canvas|node|solution|framework)/.test(lower);

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
          description: suggestion.content,
          source: "user",
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
          type: "solution",
          title: suggestion.title,
          description: suggestion.content,
          source: "user",
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
          type: "related_to",
          source: context.anchorNode.id,
          target: newNodeId,
        },
      } satisfies AddEdgeCommand,
    ],
    summary: `Saya tambahkan ${suggestion.title} sebagai solution node untuk branch "${context.anchorNode.title}".`,
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
        : "I reviewed the branch. No structural changes were applied, but the next step is to strengthen the weakest transition with new evidence or synthesis.");

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
  deliverableType: DeliverableType = "pitch_deck",
): Promise<ApiResponse<ExportPreviewPayload>> {
  return { data: buildExportPreview(readWorkspace(projectId), deliverableType) };
}

export function getMockWorkspace(projectId: string) {
  return clone(readWorkspace(projectId));
}
