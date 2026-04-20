"use client";

import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/src/lib/types/api";

import { EdgeLine } from "./EdgeLine";
import { NodeCard } from "./NodeCard";

function boardSize(nodes: KnowledgeGraphNode[]) {
  const width = Math.max(...nodes.map((node) => node.position.x), 0) + 320;
  const height = Math.max(...nodes.map((node) => node.position.y), 0) + 260;
  return {
    height: Math.max(height, 360),
    width: Math.max(width, 720),
  };
}

export function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const size = boardSize(nodes);

  return (
    <div className="rounded-[30px] border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(7,30,21,0.96),rgba(6,22,18,0.98))] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
            Graph canvas
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Knowledge graph editor
          </h2>
        </div>
        <div className="flex gap-3 text-sm text-white/58">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} edges</span>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-emerald-200/12 bg-emerald-300/5 px-5 py-16 text-center text-sm text-white/58">
          Upload a document, ask AI to add context, or create the first node manually.
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-x-auto rounded-[26px] border border-emerald-200/10 bg-[radial-gradient(circle_at_top_left,rgba(87,255,164,0.08),transparent_25%),linear-gradient(180deg,rgba(8,35,27,0.84),rgba(8,22,18,0.96))]">
            <div
              className="relative"
              style={{
                height: `${size.height}px`,
                width: `${size.width}px`,
              }}
            >
              {nodes.map((node) => (
                <div
                  className="absolute w-[240px]"
                  key={node.id}
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                  }}
                >
                  <NodeCard
                    node={node}
                    onSelect={onSelectNode}
                    selected={selectedNodeId === node.id}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                Relation map
              </p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Edges stay flat and typed. There is no parent or level hierarchy beyond node type and relation type.
              </p>
            </div>
            {edges.length > 0 ? (
              edges.map((edge) => <EdgeLine edge={edge} key={edge.id} nodes={nodes} />)
            ) : (
              <div className="rounded-[24px] border border-dashed border-emerald-200/12 bg-emerald-300/5 px-4 py-8 text-sm text-white/58">
                No edges yet. Create a node and connect it from the selected node.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
