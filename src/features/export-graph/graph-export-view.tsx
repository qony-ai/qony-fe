"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Download, LayoutPanelTop } from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import type { AuthSession } from "@/src/lib/auth/types";
import type { ProjectDetail, WorkspacePayload } from "@/src/lib/types/api";
import { truncate } from "@/src/lib/utils";
import {
  autoLayoutGraph,
  getColumnX,
  graphNodeHeight,
  graphNodeWidth,
} from "@/src/lib/workspace/graph-layout";
import { getRankDefinition, orderedRanks } from "@/src/lib/workspace/ranks";

interface GraphExportViewProps {
  autoPrint: boolean;
  initialSession?: AuthSession | null;
  project: ProjectDetail;
  workspace: WorkspacePayload;
}

const boardPadding = 88;

export function GraphExportView({
  autoPrint,
  initialSession = null,
  project,
  workspace,
}: GraphExportViewProps) {
  const graphBoard = useMemo(() => {
    const optimizedLayout = autoLayoutGraph(workspace.graph.nodes, workspace.graph.edges);
    const printNodes = workspace.graph.nodes.map((node) => ({
      ...node,
      position: optimizedLayout.get(node.id) ?? node.position,
    }));
    const minX = Math.min(0, ...printNodes.map((node) => node.position.x));
    const minY = Math.min(0, ...printNodes.map((node) => node.position.y));

    const nodes = printNodes.map((node) => ({
      ...node,
      x: node.position.x - minX + boardPadding,
      y: node.position.y - minY + boardPadding,
      definition: getRankDefinition(node.rank),
    }));

    const nodeRectMap = new Map(
      nodes.map((node) => [
        node.id,
        {
          x: node.x,
          y: node.y,
          centerY: node.y + graphNodeHeight / 2,
          rightX: node.x + graphNodeWidth,
        },
      ]),
    );

    const edges = workspace.graph.edges
      .map((edge) => {
        const source = nodeRectMap.get(edge.source);
        const target = nodeRectMap.get(edge.target);
        if (!source || !target) {
          return null;
        }

        const controlOffset = Math.max(48, (target.x - source.rightX) / 2);
        return {
          ...edge,
          path: [
            `M ${source.rightX} ${source.centerY}`,
            `C ${source.rightX + controlOffset} ${source.centerY},`,
            `${target.x - controlOffset} ${target.centerY},`,
            `${target.x} ${target.centerY}`,
          ].join(" "),
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

    const boardWidth = Math.max(
      getColumnX(6) - minX + graphNodeWidth + boardPadding * 2,
      ...nodes.map((node) => node.x + graphNodeWidth + boardPadding),
    );
    const boardHeight = Math.max(
      780,
      ...nodes.map((node) => node.y + graphNodeHeight + boardPadding),
    );

    return {
      boardHeight,
      boardWidth,
      edges,
      nodes,
      rankColumns: orderedRanks.map((rank) => ({
        definition: getRankDefinition(rank),
        x: getColumnX(rank) - minX + boardPadding,
      })),
    };
  }, [workspace.graph.edges, workspace.graph.nodes]);

  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 280);

    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  function handlePrint() {
    window.print();
  }

  return (
    <AppShell
      actions={
        <>
          <Link href={`/project/${project.id}`}>
            <Button variant="secondary">Back to project</Button>
          </Link>
          <Link href={`/export/preview/${project.id}`}>
            <Button variant="secondary">
              <LayoutPanelTop className="size-4" />
              Export preview
            </Button>
          </Link>
          <Button onClick={handlePrint}>
            <Download className="size-4" />
            Print / Save PDF
          </Button>
        </>
      }
      description="A print-ready graph board generated from the live workspace. Use the browser print dialog to save it as PDF."
      eyebrow="Graph export"
      hideHeroOnPrint
      initialSession={initialSession}
      title={`${project.name} graph`}
    >
      <div className="print-sheet grid gap-6">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            action={
              <Badge tone={workspace.graph.metadata.validation.is_valid ? "success" : "warning"}>
                {workspace.graph.metadata.validation.is_valid ? "Validated" : "Needs review"}
              </Badge>
            }
            description="This board mirrors the case graph in a static print layout so you can export it directly as a PDF."
            eyebrow="PDF board"
            title="Structured graph export"
          />

          <div className="print-board-shell mt-6 overflow-auto rounded-[28px] border border-emerald-200/10 bg-[#083a2d] p-5">
            <div
              className="print-graph-board relative mx-auto overflow-hidden rounded-[28px] border border-emerald-200/10 bg-[radial-gradient(circle_at_top,#0f5c4a,#063a2e_58%)]"
              style={{
                height: graphBoard.boardHeight,
                width: graphBoard.boardWidth,
              }}
            >
              <div className="absolute inset-0 grid grid-cols-6">
                {graphBoard.rankColumns.map((column) => (
                  <div
                    className="border-r border-emerald-200/10"
                    key={column.definition.rank}
                    style={{
                      background: `linear-gradient(180deg, color-mix(in srgb, ${column.definition.accent} 11%, transparent), transparent 28%)`,
                    }}
                  />
                ))}
              </div>

              {graphBoard.rankColumns.map((column) => (
                <div
                  className="absolute top-5 z-10 rounded-2xl border border-emerald-200/10 bg-[#08392d]/76 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl"
                  key={`label-${column.definition.rank}`}
                  style={{ left: column.x }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Rank {column.definition.rank}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/72">
                    {column.definition.shortTitle}
                  </p>
                </div>
              ))}

              <svg
                className="absolute inset-0 z-10 h-full w-full"
                fill="none"
                viewBox={`0 0 ${graphBoard.boardWidth} ${graphBoard.boardHeight}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                {graphBoard.edges.map((edge) => (
                  <path
                    d={edge.path}
                    key={edge.id}
                    markerEnd="url(#qony-arrow)"
                    stroke="rgba(255,255,255,0.34)"
                    strokeWidth="1.8"
                  />
                ))}
                <defs>
                  <marker
                    id="qony-arrow"
                    markerHeight="10"
                    markerWidth="10"
                    orient="auto"
                    refX="9"
                    refY="5"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.42)" />
                  </marker>
                </defs>
              </svg>

              {graphBoard.nodes.map((node) => (
                <article
                  className="absolute z-20 rounded-[26px] border px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.2)]"
                  key={node.id}
                  style={{
                    background: node.definition.surface,
                    borderColor: node.definition.border,
                    height: graphNodeHeight,
                    left: node.x,
                    top: node.y,
                    width: graphNodeWidth,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                        Rank {node.rank}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                        {node.definition.shortTitle}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-300/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/62">
                      {node.source}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold leading-6 text-white">
                    {truncate(node.title, 80)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    {truncate(node.content ?? "No content added yet.", 120)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
