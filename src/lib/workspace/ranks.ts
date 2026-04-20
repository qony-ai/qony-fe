import type { NodeType } from "@/src/lib/types/api";

export interface RankDefinition {
  type: NodeType;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  surface: string;
  border: string;
  colorSlot: 1 | 2 | 3 | 4 | 5 | 6;
}

const colorSlot = (slot: 1 | 2 | 3 | 4 | 5 | 6) => ({
  accent: `var(--rank-${slot}-accent)`,
  surface: `var(--rank-${slot}-surface)`,
  border: `var(--rank-${slot}-border)`,
  colorSlot: slot,
});

export const rankDefinitions: RankDefinition[] = [
  {
    type: "problem",
    title: "Problem",
    shortTitle: "Problem",
    description: "A gap, pain point, or unresolved question.",
    ...colorSlot(1),
  },
  {
    type: "risk",
    title: "Risk",
    shortTitle: "Risk",
    description: "Something that could go wrong.",
    ...colorSlot(1),
  },
  {
    type: "constraint",
    title: "Constraint",
    shortTitle: "Constraint",
    description: "A hard boundary that limits options.",
    ...colorSlot(1),
  },
  {
    type: "regulation",
    title: "Regulation",
    shortTitle: "Regulation",
    description: "External rules that shape what is possible.",
    ...colorSlot(1),
  },
  {
    type: "stakeholder",
    title: "Stakeholder",
    shortTitle: "Stakeholder",
    description: "A party whose interests affect the case.",
    ...colorSlot(2),
  },
  {
    type: "resource",
    title: "Resource",
    shortTitle: "Resource",
    description: "An asset available to the case.",
    ...colorSlot(2),
  },
  {
    type: "competitor",
    title: "Competitor",
    shortTitle: "Competitor",
    description: "A rival player in the landscape.",
    ...colorSlot(2),
  },
  {
    type: "assumption",
    title: "Assumption",
    shortTitle: "Assumption",
    description: "A working belief to validate or reject.",
    ...colorSlot(3),
  },
  {
    type: "trend",
    title: "Trend",
    shortTitle: "Trend",
    description: "A directional shift worth tracking.",
    ...colorSlot(3),
  },
  {
    type: "solution",
    title: "Solution",
    shortTitle: "Solution",
    description: "A proposed response to a problem.",
    ...colorSlot(4),
  },
  {
    type: "opportunity",
    title: "Opportunity",
    shortTitle: "Opportunity",
    description: "A favorable opening to pursue.",
    ...colorSlot(4),
  },
  {
    type: "evidence",
    title: "Evidence",
    shortTitle: "Evidence",
    description: "Support for or against a claim.",
    ...colorSlot(5),
  },
  {
    type: "market_data",
    title: "Market data",
    shortTitle: "Market data",
    description: "Measured market signal.",
    ...colorSlot(5),
  },
  {
    type: "metric",
    title: "Metric",
    shortTitle: "Metric",
    description: "A quantifiable indicator.",
    ...colorSlot(5),
  },
  {
    type: "objective",
    title: "Objective",
    shortTitle: "Objective",
    description: "A target outcome or decision.",
    ...colorSlot(6),
  },
];

export const orderedRanks: NodeType[] = rankDefinitions.map(
  (definition) => definition.type,
);

const rankDefinitionByType = new Map<NodeType, RankDefinition>(
  rankDefinitions.map((definition) => [definition.type, definition]),
);

export function getRankDefinition(type: NodeType): RankDefinition {
  return rankDefinitionByType.get(type) ?? rankDefinitions[0];
}
