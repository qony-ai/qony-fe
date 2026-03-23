import type { GraphEdge, GraphNode } from "@/src/lib/types/api";

export interface FrameworkDefinition {
  id: string;
  title: string;
  tag: string;
  aliases: string[];
  summary: string;
  why: string;
  keywords: string[];
  analysisPrompts: string[];
  evidencePrompts: string[];
}

export interface FrameworkSuggestion {
  id: string;
  title: string;
  tag: string;
  summary: string;
  why: string;
  analysisPrompts: string[];
  evidencePrompts: string[];
  content: string;
}

export interface FrameworkRecommendationContext {
  anchorNode: GraphNode;
  existingFrameworkNode: GraphNode | null;
}

export const frameworkLibrary: FrameworkDefinition[] = [
  {
    id: "swot",
    title: "SWOT Analysis",
    tag: "Positioning",
    aliases: ["swot", "wot"],
    summary:
      "Evaluate internal strengths and weaknesses alongside external opportunities and threats.",
    why: "Good for quickly framing the branch position before deciding where to focus the next analysis.",
    keywords: ["position", "market", "growth", "strategy", "competitive", "brand"],
    analysisPrompts: [
      "List internal strengths already visible in the branch.",
      "Surface internal weaknesses blocking execution or scale.",
      "Separate market opportunities from external threats.",
    ],
    evidencePrompts: [
      "Internal capability signals and performance deltas",
      "Customer or market upside indicators",
      "External risk, competitor, or regulatory pressure",
    ],
  },
  {
    id: "3cs",
    title: "3Cs Framework",
    tag: "Company / Competitor / Customer",
    aliases: ["3c", "3cs", "company competitor customer"],
    summary:
      "Assess company capability, competitor pressure, and customer behavior in one lens.",
    why: "Useful when the branch needs a clear view of what wins in the market and where the gap sits.",
    keywords: ["customer", "competitor", "market", "segment", "share", "product"],
    analysisPrompts: [
      "What can the company uniquely do today?",
      "How are competitors shaping the decision environment?",
      "What does the customer actually value or reject?",
    ],
    evidencePrompts: [
      "Capability and performance by product or channel",
      "Competitor offer, price, or distribution differences",
      "Customer need, friction, and preference signals",
    ],
  },
  {
    id: "porters-five-forces",
    title: "Porter's Five Forces",
    tag: "Industry attractiveness",
    aliases: ["porter", "five forces", "porter's five forces", "porters five forces"],
    summary:
      "Measure industry attractiveness through entrants, suppliers, buyers, substitutes, and rivalry.",
    why: "Best when the branch points to structural industry pressure rather than only internal execution.",
    keywords: ["industry", "supplier", "buyer", "substitute", "rivalry", "entrant"],
    analysisPrompts: [
      "Assess the threat of new entrants and substitutes.",
      "Measure buyer and supplier power on this branch.",
      "Decide whether rivalry is structural or temporary.",
    ],
    evidencePrompts: [
      "Price pressure and switching behavior",
      "Supplier concentration or dependency data",
      "Competitor intensity and substitute options",
    ],
  },
  {
    id: "pestel",
    title: "PESTEL Analysis",
    tag: "Macro environment",
    aliases: ["pestel", "pestle"],
    summary:
      "Review political, economic, social, technological, environmental, and legal forces affecting the branch.",
    why: "Useful for long-term external shifts that reshape the business context around the case.",
    keywords: ["regulation", "macro", "economic", "policy", "technology", "legal"],
    analysisPrompts: [
      "Identify the external factor most likely to move the branch.",
      "Separate short-term macro noise from structural change.",
      "Tie each external force back to business impact.",
    ],
    evidencePrompts: [
      "Policy, legal, or regulatory developments",
      "Demand, cost, and macroeconomic indicators",
      "Technology or environmental shifts affecting operations",
    ],
  },
  {
    id: "most",
    title: "MOST",
    tag: "Mission / Objectives / Strategies / Tactics",
    aliases: ["most", "mission objectives strategies tactics"],
    summary:
      "Align mission, objectives, strategies, and tactics from the top level down to execution.",
    why: "Useful when the branch suffers from weak alignment between strategy and day-to-day action.",
    keywords: ["objective", "strategy", "tactic", "mission", "execution", "alignment"],
    analysisPrompts: [
      "Clarify the top mission behind the branch.",
      "Translate that mission into concrete objectives.",
      "Check whether current tactics actually support the strategy.",
    ],
    evidencePrompts: [
      "Target vs actual objective metrics",
      "Strategy ownership and execution cadence",
      "Tactics currently consuming time or budget",
    ],
  },
  {
    id: "7s-mckinsey",
    title: "7S McKinsey",
    tag: "Internal alignment",
    aliases: ["7s", "mckinsey 7s", "7s mckinsey"],
    summary:
      "Analyze alignment across strategy, structure, systems, shared values, style, staff, and skills.",
    why: "Best when the branch looks like an internal operating-model or change-management issue.",
    keywords: ["team", "org", "structure", "skill", "system", "staff", "culture"],
    analysisPrompts: [
      "Find where internal alignment breaks first.",
      "Separate structural issues from people or skills issues.",
      "Identify which 7S dimension must move first to unlock the branch.",
    ],
    evidencePrompts: [
      "Org design, role clarity, and decision rights",
      "System or workflow maturity",
      "Capability, staffing, and culture signals",
    ],
  },
  {
    id: "value-chain",
    title: "Value Chain Analysis",
    tag: "Value creation",
    aliases: ["value chain", "value-chain", "value chain analysis"],
    summary:
      "Map primary and support activities to see where value is created, lost, or too expensive.",
    why: "Useful for operations, margin, service quality, and process-heavy branches.",
    keywords: ["operation", "process", "cost", "service", "delivery", "inventory", "supply"],
    analysisPrompts: [
      "Map where value is created step by step.",
      "Identify the activity where value leaks or cost spikes.",
      "Separate core from supporting activities before redesign.",
    ],
    evidencePrompts: [
      "Cycle time and cost by activity",
      "Service level or output quality by stage",
      "Handoff, delay, or waste points in the chain",
    ],
  },
];

function buildAdjacency(edges: GraphEdge[]) {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  });

  return { incoming, outgoing };
}

function findClosestConnectedNodeAtRank(
  startNode: GraphNode,
  targetRank: number,
  nodeMap: Map<string, GraphNode>,
  adjacency: Map<string, string[]>,
) {
  const visited = new Set<string>([startNode.id]);
  const queue = [...(adjacency.get(startNode.id) ?? [])];

  while (queue.length > 0) {
    const candidateId = queue.shift();
    if (!candidateId || visited.has(candidateId)) {
      continue;
    }

    visited.add(candidateId);
    const candidate = nodeMap.get(candidateId);
    if (!candidate) {
      continue;
    }

    if (candidate.rank === targetRank) {
      return candidate;
    }

    queue.push(...(adjacency.get(candidate.id) ?? []));
  }

  return null;
}

export function detectFrameworkFromText(text: string) {
  const lower = text.toLowerCase();
  return (
    frameworkLibrary.find((framework) =>
      framework.aliases.some((alias) => lower.includes(alias)),
    ) ?? null
  );
}

export function buildFrameworkContent(
  anchorNode: GraphNode,
  framework: FrameworkDefinition,
) {
  return [
    `Recommended framework: ${framework.title}`,
    "",
    `Branch anchor: ${anchorNode.title}`,
    framework.summary,
    `Why this fits: ${framework.why}`,
    "",
    "Analysis prompts:",
    ...framework.analysisPrompts.map((item) => `- ${item}`),
    "",
    "Evidence cues:",
    ...framework.evidencePrompts.map((item) => `- ${item}`),
  ].join("\n");
}

export function buildFrameworkSuggestion(
  anchorNode: GraphNode,
  framework: FrameworkDefinition,
): FrameworkSuggestion {
  return {
    id: framework.id,
    title: framework.title,
    tag: framework.tag,
    summary: framework.summary,
    why: framework.why,
    analysisPrompts: framework.analysisPrompts,
    evidencePrompts: framework.evidencePrompts,
    content: buildFrameworkContent(anchorNode, framework),
  };
}

export function resolveFrameworkRecommendationContext(
  selectedNodeId: string | null,
  nodes: GraphNode[],
  edges: GraphEdge[],
): FrameworkRecommendationContext | null {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const { incoming, outgoing } = buildAdjacency(edges);
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;

  let anchorNode =
    selectedNode?.rank === 3
      ? selectedNode
      : selectedNode
        ? selectedNode.rank < 3
          ? findClosestConnectedNodeAtRank(selectedNode, 3, nodeMap, outgoing)
          : findClosestConnectedNodeAtRank(selectedNode, 3, nodeMap, incoming)
        : null;

  anchorNode ??= nodes.find((node) => node.rank === 3) ?? null;

  if (!anchorNode) {
    return null;
  }

  let existingFrameworkNode: GraphNode | null =
    selectedNode?.rank === 4 ? selectedNode : null;

  if (!existingFrameworkNode && selectedNode && selectedNode.rank > 4) {
    existingFrameworkNode = findClosestConnectedNodeAtRank(
      selectedNode,
      4,
      nodeMap,
      incoming,
    );
  }

  if (!existingFrameworkNode) {
    const directFrameworkId = (outgoing.get(anchorNode.id) ?? []).find((nodeId) => {
      const node = nodeMap.get(nodeId);
      return node?.rank === 4;
    });
    existingFrameworkNode = directFrameworkId
      ? nodeMap.get(directFrameworkId) ?? null
      : null;
  }

  return {
    anchorNode,
    existingFrameworkNode,
  };
}

export function getFrameworkSuggestions(anchorNode: GraphNode) {
  const branchText = `${anchorNode.title} ${anchorNode.content ?? ""}`.toLowerCase();
  return frameworkLibrary
    .map((framework) => ({
      framework,
      score: framework.keywords.reduce(
        (total, keyword) => total + (branchText.includes(keyword) ? 2 : 0),
        0,
      ),
    }))
    .toSorted((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.framework.title.localeCompare(right.framework.title);
    })
    .map(({ framework }) => buildFrameworkSuggestion(anchorNode, framework));
}
