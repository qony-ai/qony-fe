"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Eye, Plus } from "lucide-react";

import type { GraphNode, NodeRank, WorkspaceGraph } from "@/src/lib/types/api";
import { cn, truncate } from "@/src/lib/utils";
import {
  clampCanvasPosition,
  getHighlightedBranch,
  getColumnX,
  graphSnapSize,
} from "@/src/lib/workspace/graph-layout";
import { getNextRank, getRankDefinition, orderedRanks } from "@/src/lib/workspace/ranks";

interface WorkspaceGraphProps {
  graph: WorkspaceGraph;
  selectedNode: GraphNode | null;
  selectedNodeId: string | null;
  onConnectNodes: (connection: { source: string; target: string }) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onQuickAddNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string | null) => void;
}

interface WorkspaceNodeData extends Record<string, unknown> {
  canCreateChild: boolean;
  content: string | null;
  highlighted: boolean;
  kind: string;
  onInspectNode: (nodeId: string) => void;
  onQuickAddNode: (nodeId: string) => void;
  rank: NodeRank;
  source: GraphNode["source"];
  title: string;
}

const nodeTypes = {
  qonyNode: WorkspaceNode,
};

export function WorkspaceGraph({
  graph,
  selectedNode,
  selectedNodeId,
  onConnectNodes,
  onMoveNode,
  onQuickAddNode,
  onSelectNode,
}: WorkspaceGraphProps) {
  const highlighted = useMemo(
    () => getHighlightedBranch(graph, selectedNodeId),
    [graph, selectedNodeId],
  );

  const flowState = useMemo(
    () =>
      mapGraphToFlow(
        graph,
        highlighted,
        selectedNodeId,
        onSelectNode,
        onQuickAddNode,
      ),
    [graph, highlighted, onQuickAddNode, onSelectNode, selectedNodeId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkspaceNodeData>>(
    flowState.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(flowState.edges);

  useEffect(() => {
    setNodes(flowState.nodes);
    setEdges(flowState.edges);
  }, [flowState.edges, flowState.nodes, setEdges, setNodes]);

  const validConnections = useMemo(() => {
    const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
    const edgeKeySet = new Set(
      graph.edges.map((edge) => `${edge.source}->${edge.target}`),
    );

    return (connection: Connection | Edge) => {
      if (!connection.source || !connection.target) {
        return false;
      }

      const source = nodeMap.get(connection.source);
      const target = nodeMap.get(connection.target);
      if (!source || !target) {
        return false;
      }

      if (source.id === target.id) {
        return false;
      }

      if (target.rank !== source.rank + 1) {
        return false;
      }

      return !edgeKeySet.has(`${source.id}->${target.id}`);
    };
  }, [graph.edges, graph.nodes]);

  return (
    <div className="canvas-grid relative h-full overflow-hidden bg-[radial-gradient(circle_at_top,#0b6a58,#083e32_58%)]">
      <LaneOverlay />

      <div className="pointer-events-none absolute inset-x-4 top-20 z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="pointer-events-auto rounded-full border border-emerald-200/12 bg-[#0a3f31]/90 px-4 py-2 text-xs font-medium text-white/78 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            Adjacent-rank connections only
          </div>
          <div className="pointer-events-auto rounded-full border border-emerald-200/12 bg-[#0a3f31]/90 px-4 py-2 text-xs font-medium text-white/78 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            Drag to reorder inside each lane
          </div>
        </div>
        <div className="pointer-events-auto rounded-full border border-emerald-300/18 bg-emerald-300/10 px-4 py-2 text-xs font-medium text-emerald-50 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {selectedNode
            ? `Selected: ${truncate(selectedNode.title, 56)}`
            : "Select a node to inspect or extend the branch"}
        </div>
      </div>

      <ReactFlow
        colorMode="dark"
        connectionLineStyle={{ stroke: "rgba(20,234,205,0.72)", strokeWidth: 1.8 }}
        connectionRadius={24}
        defaultEdgeOptions={{
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: "rgba(188,255,226,0.5)",
          },
          style: {
            stroke: "rgba(188,255,226,0.28)",
            strokeWidth: 1.5,
          },
          type: "smoothstep",
        }}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        isValidConnection={validConnections}
        maxZoom={1.6}
        minZoom={0.45}
        nodes={nodes}
        nodesConnectable
        nodesDraggable
        nodeTypes={nodeTypes}
        onConnect={(connection) => {
          if (connection.source && connection.target && validConnections(connection)) {
            onConnectNodes({
              source: connection.source,
              target: connection.target,
            });
          }
        }}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onNodeDragStop={(_, node) => {
          onMoveNode(
            node.id,
            clampCanvasPosition({
              x: node.position.x,
              y: node.position.y,
            }),
          );
        }}
        onNodesChange={onNodesChange}
        onPaneClick={() => onSelectNode(null)}
        panOnScroll
        proOptions={{ hideAttribution: true }}
        selectionOnDrag
        snapGrid={[graphSnapSize, graphSnapSize]}
        snapToGrid
      >
        <Background color="rgba(214,255,237,0.08)" gap={28} variant={BackgroundVariant.Lines} />
        <MiniMap
          className="!bottom-4 !right-4 !rounded-2xl !border !border-emerald-200/12 !bg-[#0a3f31]/88"
          maskColor="rgba(8,53,42,0.62)"
          nodeColor={(node) => getRankDefinition((node.data as WorkspaceNodeData).rank).accent}
          nodeStrokeColor={() => "rgba(214,255,237,0.22)"}
          pannable
          zoomable
        />
        <Controls
          className="!bottom-4 !left-4 !rounded-2xl !border !border-emerald-200/12 !bg-[#0a3f31]/88 [&_button]:!border-emerald-200/12 [&_button]:!bg-[#0a3f31]/88 [&_button]:!text-white"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

function mapGraphToFlow(
  graph: WorkspaceGraph,
  highlighted: { edgeIds: Set<string>; nodeIds: Set<string> },
  selectedNodeId: string | null,
  onInspectNode: (nodeId: string | null) => void,
  onQuickAddNode: (nodeId: string) => void,
) {
  const nodes: Array<Node<WorkspaceNodeData>> = graph.nodes.map((node) => {
    const rank = getRankDefinition(node.rank);
    const isSelected = selectedNodeId === node.id;
    const isHighlighted =
      highlighted.nodeIds.size === 0 ? true : highlighted.nodeIds.has(node.id);

    return {
      id: node.id,
      type: "qonyNode",
      position: {
        x: Number.isFinite(node.position.x) ? node.position.x : getColumnX(node.rank),
        y: Number.isFinite(node.position.y) ? node.position.y : 0,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      selected: isSelected,
      data: {
        canCreateChild: getNextRank(node.rank) !== null,
        content: node.content ?? null,
        highlighted: isHighlighted,
        kind: node.kind,
        onInspectNode: (nodeId: string) => onInspectNode(nodeId),
        onQuickAddNode,
        rank: node.rank,
        source: node.source,
        title: node.title,
      },
      draggable: true,
      style: {
        width: 288,
        background: rank.surface,
        border: `1px solid ${isSelected ? rank.accent : rank.border}`,
        borderRadius: 26,
        boxShadow: isSelected
          ? `0 22px 55px color-mix(in srgb, ${rank.accent} 22%, transparent)`
          : "0 18px 42px rgba(0,0,0,0.2)",
        opacity: isHighlighted ? 1 : 0.38,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    animated: highlighted.edgeIds.has(edge.id),
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: highlighted.edgeIds.has(edge.id)
        ? "rgba(108,231,175,0.88)"
        : "rgba(255,255,255,0.28)",
    },
    style: {
      stroke: highlighted.edgeIds.has(edge.id)
        ? "rgba(108,231,175,0.88)"
        : "rgba(255,255,255,0.22)",
      strokeWidth: highlighted.edgeIds.has(edge.id) ? 2.4 : 1.5,
      opacity:
        highlighted.edgeIds.size === 0 || highlighted.edgeIds.has(edge.id)
          ? 1
          : 0.28,
    },
  }));

  return { nodes, edges };
}

function WorkspaceNode({
  id,
  data,
  selected,
}: NodeProps<Node<WorkspaceNodeData>>) {
  const rank = getRankDefinition(data.rank);

  return (
    <div
      className={cn(
        "group relative w-full rounded-[26px] px-4 py-4 text-left transition duration-200",
        data.highlighted ? "opacity-100" : "opacity-75",
      )}
    >
      <Handle
        className="!size-3 !border-2 !border-slate-950"
        position={Position.Left}
        style={{ background: rank.accent }}
        type="target"
      />
      <Handle
        className="!size-3 !border-2 !border-slate-950"
        position={Position.Right}
        style={{ background: rank.accent }}
        type="source"
      />

      <div
        className="absolute inset-x-4 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${rank.accent}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
            Rank {data.rank}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
            {rank.shortTitle}
          </p>
        </div>
        <span
          className="inline-flex rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: selected ? rank.accent : "rgba(255,255,255,0.56)",
          }}
        >
          {data.source}
        </span>
      </div>

      <h3 className="mt-4 text-[15px] font-semibold leading-6 text-white">
        {data.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/56">
        {truncate(data.content ?? "Add content to deepen this node.", 130)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/36">
          {data.kind.replaceAll("-", " ")}
        </p>
        <div
          className="h-px flex-1"
          style={{
            background: selected
              ? `linear-gradient(90deg, transparent, ${rank.accent}, transparent)`
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/8 px-3 py-1.5 text-xs font-semibold text-white/76 transition hover:bg-emerald-300/12 hover:text-white"
          onClick={(event) => {
            event.stopPropagation();
            data.onInspectNode(id);
          }}
          type="button"
        >
          <Eye className="size-3.5" />
          Inspect
        </button>
        {data.canCreateChild ? (
          <button
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition hover:border-emerald-300/28 hover:bg-emerald-300/16"
            onClick={(event) => {
              event.stopPropagation();
              data.onQuickAddNode(id);
            }}
            type="button"
          >
            <Plus className="size-3.5" />
            Add next
          </button>
        ) : null}
      </div>
    </div>
  );
}

function LaneOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden grid-cols-6 lg:grid">
      {orderedRanks.map((rank) => {
        const definition = getRankDefinition(rank);
        return (
          <div
            className="border-r border-emerald-200/10 px-4 pt-4"
            key={rank}
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${definition.accent} 10%, transparent), transparent 22%)`,
            }}
          >
            <div className="rounded-2xl border border-emerald-200/10 bg-[#08392d]/76 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                Rank {definition.rank}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/72">
                {definition.shortTitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
