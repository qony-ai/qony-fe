import type { NodeRank } from "@/src/lib/types/api";

export interface RankDefinition {
  rank: NodeRank;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  surface: string;
  border: string;
}

export const rankDefinitions: RankDefinition[] = [
  {
    rank: 1,
    title: "Problem Statement",
    shortTitle: "Problem",
    description: "The root question that anchors the case.",
    accent: "var(--rank-1-accent)",
    surface: "var(--rank-1-surface)",
    border: "var(--rank-1-border)",
  },
  {
    rank: 2,
    title: "Sub-Problem",
    shortTitle: "Sub-Problem",
    description: "Resolvable branches of the main problem.",
    accent: "var(--rank-2-accent)",
    surface: "var(--rank-2-surface)",
    border: "var(--rank-2-border)",
  },
  {
    rank: 3,
    title: "Hypothesis",
    shortTitle: "Hypothesis",
    description: "Working assumptions to validate or reject.",
    accent: "var(--rank-3-accent)",
    surface: "var(--rank-3-surface)",
    border: "var(--rank-3-border)",
  },
  {
    rank: 4,
    title: "Framework / Analysis",
    shortTitle: "Framework",
    description: "Structured analytical lens applied to the branch.",
    accent: "var(--rank-4-accent)",
    surface: "var(--rank-4-surface)",
    border: "var(--rank-4-border)",
  },
  {
    rank: 5,
    title: "Supporting Data / Evidence",
    shortTitle: "Evidence",
    description: "Quantitative or qualitative support.",
    accent: "var(--rank-5-accent)",
    surface: "var(--rank-5-surface)",
    border: "var(--rank-5-border)",
  },
  {
    rank: 6,
    title: "Synthesis",
    shortTitle: "Synthesis",
    description: "Decision-ready conclusion for the branch.",
    accent: "var(--rank-6-accent)",
    surface: "var(--rank-6-surface)",
    border: "var(--rank-6-border)",
  },
];

export const orderedRanks = rankDefinitions.map(
  (definition) => definition.rank,
);

export function getRankDefinition(rank: NodeRank) {
  return (
    rankDefinitions.find((definition) => definition.rank === rank) ??
    rankDefinitions[0]
  );
}

export function getNextRank(rank: NodeRank): NodeRank | null {
  return rank < 6 ? ((rank + 1) as NodeRank) : null;
}
