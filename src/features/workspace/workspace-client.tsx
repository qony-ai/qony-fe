"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Bot,
  Download,
  GripVertical,
  LayoutPanelTop,
  Link2,
  LoaderCircle,
  MoveRight,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { browserApi } from "@/src/lib/api/client";
import type {
  AddEdgeCommand,
  AddNodeCommand,
  Position,
  UpdateNodeCommand,
  WorkspaceChatMessage,
  WorkspaceMutationRequest,
  WorkspacePayload,
} from "@/src/lib/types/api";
import { cn, truncate } from "@/src/lib/utils";
import {
  autoLayoutGraph,
  getSuggestedChildPosition,
  readBranchIndex,
} from "@/src/lib/workspace/graph-layout";
import {
  getFrameworkSuggestions,
  resolveFrameworkRecommendationContext,
  type FrameworkSuggestion,
} from "@/src/lib/workspace/frameworks";
import { getNextRank, getRankDefinition } from "@/src/lib/workspace/ranks";

const WorkspaceGraph = dynamic(
  () =>
    import("./workspace-graph").then((module) => ({
      default: module.WorkspaceGraph,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-grid flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#0a1723,#06101a_58%)] text-sm text-white/56">
        Loading workspace graph...
      </div>
    ),
  },
);

interface WorkspaceClientProps {
  initialWorkspace: WorkspacePayload;
}

type SidebarTab = "diagram" | "copilot";

const defaultSidebarWidth = 296;
const minSidebarWidth = 272;
const maxSidebarWidth = 520;

export function WorkspaceClient({ initialWorkspace }: WorkspaceClientProps) {
  const initialSelectedNode = initialWorkspace.graph.nodes[0] ?? null;
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelectedNode?.id ?? null,
  );
  const [nodeTitle, setNodeTitle] = useState(initialSelectedNode?.title ?? "");
  const [nodeContent, setNodeContent] = useState(
    initialSelectedNode?.content ?? "",
  );
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeContent, setNewNodeContent] = useState("");
  const [parentNodeId, setParentNodeId] = useState<string>(
    initialSelectedNode && getNextRank(initialSelectedNode.rank)
      ? initialSelectedNode.id
      : "",
  );
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("diagram");
  const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
  const [lastExpandedSidebarWidth, setLastExpandedSidebarWidth] = useState(
    defaultSidebarWidth,
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nodes = workspace.graph.nodes;
  const edges = workspace.graph.edges;
  const validation = workspace.graph.metadata.validation;
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const rootNodes = useMemo(
    () => nodes.filter((node) => node.rank === 1),
    [nodes],
  );
  const rootNode = useMemo(
    () => nodes.find((node) => node.rank === 1) ?? nodes[0] ?? null,
    [nodes],
  );
  const parentNode = parentNodeId ? nodeMap.get(parentNodeId) ?? null : null;
  const nextRank = parentNode ? getNextRank(parentNode.rank) : nodes.length === 0 ? 1 : null;
  const childCandidates = useMemo(
    () => nodes.filter((node) => getNextRank(node.rank) !== null),
    [nodes],
  );
  const targetOptions = useMemo(() => {
    const sourceNode = edgeSource ? nodeMap.get(edgeSource) ?? null : null;
    if (!sourceNode) {
      return [];
    }

    const allowedRank = getNextRank(sourceNode.rank);
    if (!allowedRank) {
      return [];
    }

    const existingTargets = new Set(
      edges
        .filter((edge) => edge.source === sourceNode.id)
        .map((edge) => edge.target),
    );

    return nodes.filter(
      (node) =>
        node.id !== sourceNode.id &&
        node.rank === allowedRank &&
        !existingTargets.has(node.id),
    );
  }, [edgeSource, edges, nodeMap, nodes]);
  const ingestMode =
    typeof workspace.graph.metadata.attributes.ingest_mode === "string"
      ? workspace.graph.metadata.attributes.ingest_mode
      : null;
  const connectionHint = useMemo(() => {
    if (!edgeSource) {
      return "Select a source node to constrain the target list to the next valid rank.";
    }

    const sourceNode = nodeMap.get(edgeSource);
    if (!sourceNode) {
      return "The source node is no longer available.";
    }

    const allowedRank = getNextRank(sourceNode.rank);
    if (!allowedRank) {
      return "Rank 6 nodes cannot create outgoing edges.";
    }

    return `This edge must end at Rank ${allowedRank} (${getRankDefinition(allowedRank).shortTitle}).`;
  }, [edgeSource, nodeMap]);
  const selectedRankDefinition = selectedNode
    ? getRankDefinition(selectedNode.rank)
    : null;
  const frameworkContext = useMemo(
    () => resolveFrameworkRecommendationContext(selectedNodeId, nodes, edges),
    [edges, nodes, selectedNodeId],
  );
  const frameworkSuggestions = useMemo(
    () =>
      frameworkContext ? getFrameworkSuggestions(frameworkContext.anchorNode) : [],
    [frameworkContext],
  );

  useEffect(() => {
    if (isSidebarCollapsed || !isResizingSidebar) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const layout = layoutRef.current?.getBoundingClientRect();
      if (!layout) {
        return;
      }

      const nextWidth = Math.min(
        maxSidebarWidth,
        Math.max(minSidebarWidth, layout.right - event.clientX),
      );
      setSidebarWidth(nextWidth);
      setLastExpandedSidebarWidth(nextWidth);
    }

    function handlePointerUp() {
      setIsResizingSidebar(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingSidebar, isSidebarCollapsed]);

  function handleStartSidebarResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsSidebarCollapsed(false);
    setIsResizingSidebar(true);
  }

  function handleCollapseSidebar() {
    setLastExpandedSidebarWidth(sidebarWidth);
    setIsSidebarCollapsed(true);
    setIsResizingSidebar(false);
  }

  function handleExpandSidebar() {
    setSidebarWidth(lastExpandedSidebarWidth);
    setIsSidebarCollapsed(false);
  }

  function syncSelection(
    nodeId: string | null,
    nextWorkspace: WorkspacePayload = workspace,
  ) {
    const nextNode = nodeId
      ? nextWorkspace.graph.nodes.find((node) => node.id === nodeId) ?? null
      : null;

    setSelectedNodeId(nextNode?.id ?? null);
    setNodeTitle(nextNode?.title ?? "");
    setNodeContent(nextNode?.content ?? "");
    setParentNodeId(nextNode && getNextRank(nextNode.rank) ? nextNode.id : "");
  }

  function applyWorkspaceUpdate(nextWorkspace: WorkspacePayload) {
    setWorkspace(nextWorkspace);
    const nextSelectedId =
      selectedNodeId &&
      nextWorkspace.graph.nodes.some((node) => node.id === selectedNodeId)
        ? selectedNodeId
        : nextWorkspace.graph.nodes[0]?.id ?? null;
    syncSelection(nextSelectedId, nextWorkspace);
  }

  function submitMutation(
    payload: WorkspaceMutationRequest,
    onSuccess?: (nextWorkspace: WorkspacePayload) => void,
  ) {
    startTransition(async () => {
      try {
        const response = await browserApi.mutateWorkspace(payload);
        const nextWorkspace = {
          ...workspace,
          graph: response.graph,
        };
        applyWorkspaceUpdate(nextWorkspace);
        setError(null);
        onSuccess?.(nextWorkspace);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Workspace mutation failed.",
        );
      }
    });
  }

  function handleSelectNode(nodeId: string | null) {
    setSidebarTab("diagram");
    syncSelection(nodeId);
  }

  function handlePrepareChildNode(nodeId: string) {
    setSidebarTab("diagram");
    syncSelection(nodeId);
    setParentNodeId(nodeId);
  }

  function handleSaveNode() {
    if (!selectedNode) {
      return;
    }

    submitMutation({
      actor: "user",
      commands: [
        {
          type: "update_node",
          node_id: selectedNode.id,
          title: nodeTitle,
          content: nodeContent,
        },
      ],
      expected_version: workspace.graph.metadata.version,
      project_id: workspace.project_id,
      reason: "Update selected node",
    });
  }

  function handleDeleteNode(nodeId: string) {
    submitMutation({
      actor: "user",
      commands: [{ type: "delete_node", node_id: nodeId }],
      expected_version: workspace.graph.metadata.version,
      project_id: workspace.project_id,
      reason: "Delete selected node",
    });
  }

  function handleAddNode() {
    if (nodes.length > 0 && !parentNode) {
      setError("Select a parent node before adding a new child.");
      return;
    }

    if (!newNodeTitle.trim()) {
      setError("Add a title before creating a node.");
      return;
    }

    const rank = nextRank;
    if (!rank) {
      setError("This node already sits at Rank 6 and cannot create another child.");
      return;
    }

    const siblings = parentNode
      ? nodes.filter(
          (node) =>
            readBranchIndex(node.metadata.branch_index) ===
              readBranchIndex(parentNode.metadata.branch_index) &&
            node.rank === rank,
        )
      : [];
    const newId = crypto.randomUUID();
    const position = getSuggestedChildPosition({
      parent: parentNode,
      rank,
      siblings,
    });
    const branchIndex = parentNode
      ? parentNode.rank === 1
        ? Math.max(
            -1,
            ...nodes
              .filter((node) => node.rank === rank)
              .map((node) => readBranchIndex(node.metadata.branch_index)),
          ) + 1
        : readBranchIndex(parentNode.metadata.branch_index)
      : 0;

    const commands: WorkspaceMutationRequest["commands"] = [
      {
        type: "add_node",
        node: {
          id: newId,
          rank,
          title: newNodeTitle.trim(),
          content: newNodeContent.trim() || undefined,
          source: "manual",
          position,
          metadata: {
            branch_index: branchIndex,
          },
        },
      } satisfies AddNodeCommand,
    ];

    if (parentNode) {
      commands.push({
        type: "add_edge",
        edge: {
          source: parentNode.id,
          target: newId,
        },
      } satisfies AddEdgeCommand);
    }

    submitMutation(
      {
        actor: "user",
        commands,
        expected_version: workspace.graph.metadata.version,
        project_id: workspace.project_id,
        reason: "Add new structured node",
      },
      (nextWorkspace) => {
        setNewNodeTitle("");
        setNewNodeContent("");
        syncSelection(newId, nextWorkspace);
      },
    );
  }

  function handleConnectNodes(connection: { source: string; target: string }) {
    const source = nodeMap.get(connection.source);
    const target = nodeMap.get(connection.target);
    if (!source || !target) {
      return;
    }

    if (target.rank !== source.rank + 1) {
      setError(`Rank ${source.rank} can only connect to Rank ${source.rank + 1}.`);
      return;
    }

    submitMutation({
      actor: "user",
      commands: [
        {
          type: "add_edge",
          edge: connection,
        },
      ],
      expected_version: workspace.graph.metadata.version,
      project_id: workspace.project_id,
      reason: "Connect branch nodes",
    });
  }

  function handleManualEdge() {
    if (!edgeSource || !edgeTarget) {
      setError("Choose both source and target nodes.");
      return;
    }

    handleConnectNodes({
      source: edgeSource,
      target: edgeTarget,
    });
  }

  function handleMoveNode(nodeId: string, position: Position) {
    const previousWorkspace = workspace;
    const optimisticWorkspace: WorkspacePayload = {
      ...workspace,
      graph: {
        ...workspace.graph,
        nodes: workspace.graph.nodes.map((node) =>
          node.id === nodeId ? { ...node, position } : node,
        ),
      },
    };

    setWorkspace(optimisticWorkspace);

    startTransition(async () => {
      try {
        const response = await browserApi.mutateWorkspace({
          actor: "user",
          commands: [
            {
              type: "move_node",
              node_id: nodeId,
              position,
            },
          ],
          expected_version: previousWorkspace.graph.metadata.version,
          project_id: previousWorkspace.project_id,
          reason: "Adjust node position",
        });
        applyWorkspaceUpdate({
          ...optimisticWorkspace,
          graph: response.graph,
        });
        setError(null);
      } catch (requestError) {
        setWorkspace(previousWorkspace);
        syncSelection(selectedNodeId, previousWorkspace);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Workspace mutation failed.",
        );
      }
    });
  }

  function handleAutoLayout() {
    const layout = autoLayoutGraph(nodes, edges);
    const commands = nodes
      .map((node) => {
        const nextPosition = layout.get(node.id);
        if (
          !nextPosition ||
          (nextPosition.x === node.position.x && nextPosition.y === node.position.y)
        ) {
          return null;
        }

        return {
          type: "move_node" as const,
          node_id: node.id,
          position: nextPosition,
        };
      })
      .filter(
        (
          value,
        ): value is {
          type: "move_node";
          node_id: string;
          position: Position;
        } => value !== null,
      );

    if (commands.length === 0) {
      return;
    }

    submitMutation({
      actor: "user",
      commands,
      expected_version: workspace.graph.metadata.version,
      project_id: workspace.project_id,
      reason: "Auto-layout graph",
    });
  }

  function handleExportGraphPdf() {
    const url = `/export/graph/${workspace.project_id}?autoprint=1`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.href = url;
    }
  }

  function handleChat() {
    if (chatInput.trim().length < 5) {
      setError("Copilot prompts need a little more detail.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await browserApi.chatWorkspace({
          expected_version: workspace.graph.metadata.version,
          message: chatInput,
          project_id: workspace.project_id,
          selected_node_id: selectedNodeId,
        });
        applyWorkspaceUpdate({
          chat: response.chat,
          graph: response.graph,
          project_id: response.project_id,
          workspace_id: response.workspace_id,
        });
        setChatInput("");
        setError(null);
        setSidebarTab("copilot");
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Copilot request failed.",
        );
      }
    });
  }

  function handleApplyFrameworkSuggestion(suggestion: FrameworkSuggestion) {
    if (!frameworkContext) {
      setError("Add or select a hypothesis branch before applying a framework.");
      return;
    }

    if (selectedNode?.rank === 4) {
      submitMutation(
        {
          actor: "ai",
          commands: [
            {
              type: "update_node",
              node_id: selectedNode.id,
              title: suggestion.title,
              content: suggestion.content,
              source: "ai",
              metadata: {
                framework_key: suggestion.id,
                recommended_for: frameworkContext.anchorNode.id,
              },
              merge_metadata: true,
            } satisfies UpdateNodeCommand,
          ],
          expected_version: workspace.graph.metadata.version,
          project_id: workspace.project_id,
          reason: "Apply AI framework recommendation",
        },
        () => {
          setError(null);
        },
      );
      return;
    }

    const newNodeId = crypto.randomUUID();
    const siblings = nodes.filter(
      (node) =>
        node.rank === 4 &&
        readBranchIndex(node.metadata.branch_index) ===
          readBranchIndex(frameworkContext.anchorNode.metadata.branch_index),
    );

    submitMutation(
      {
        actor: "ai",
        commands: [
          {
            type: "add_node",
            node: {
              id: newNodeId,
              rank: 4,
              title: suggestion.title,
              content: suggestion.content,
              source: "ai",
              position: getSuggestedChildPosition({
                parent: frameworkContext.anchorNode,
                rank: 4,
                siblings,
              }),
              metadata: {
                branch_index: readBranchIndex(
                  frameworkContext.anchorNode.metadata.branch_index,
                ),
                framework_key: suggestion.id,
                recommended_for: frameworkContext.anchorNode.id,
              },
            },
          } satisfies AddNodeCommand,
          {
            type: "add_edge",
            edge: {
              source: frameworkContext.anchorNode.id,
              target: newNodeId,
            },
          } satisfies AddEdgeCommand,
        ],
        expected_version: workspace.graph.metadata.version,
        project_id: workspace.project_id,
        reason: "Add AI framework recommendation",
      },
      (nextWorkspace) => {
        syncSelection(newNodeId, nextWorkspace);
        setSidebarTab("diagram");
      },
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#0a3f31,#0a5a49_36%,#094537)] text-white">
      <div className="flex h-full overflow-hidden" ref={layoutRef}>
        <section className="relative min-w-0 flex-1 overflow-hidden">
          <Link
            className="absolute left-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-200/14 bg-[#0a3f31]/88 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:bg-[#0c4d3a]"
            href={`/project/${workspace.project_id}`}
          >
            <ArrowLeft className="size-4" />
            Back to project
          </Link>

          {nodes.length > 0 ? (
            <WorkspaceGraph
              graph={workspace.graph}
              onConnectNodes={handleConnectNodes}
              onMoveNode={handleMoveNode}
              onQuickAddNode={handlePrepareChildNode}
              onSelectNode={handleSelectNode}
              selectedNode={selectedNode}
              selectedNodeId={selectedNodeId}
            />
          ) : (
            <div className="canvas-grid flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#0f5c4a,#063a2e_58%)] px-6 text-center">
              <div className="max-w-lg">
                <Badge tone="subtle">Empty workspace</Badge>
                <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white">
                  Start from the root problem.
                </h1>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  This workspace is now a full-screen structured canvas. Add the
                  first Rank 1 node from the rail on the right, or ingest source
                  material before you start editing.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setParentNodeId("")}>
                    <Plus className="size-4" />
                    Create root node
                  </Button>
                  <Link href={`/project/ingest?projectId=${workspace.project_id}`}>
                    <Button variant="secondary">Open ingest</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {error ? (
            <div className="pointer-events-none absolute bottom-4 left-4 z-30 max-w-md rounded-2xl border border-emerald-200/12 bg-emerald-300/8 px-4 py-3 text-sm text-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              {error}
            </div>
          ) : null}

          {isSidebarCollapsed ? (
            <button
              className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-200/14 bg-[#0a3f31]/88 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:bg-[#0c4d3a]"
              onClick={handleExpandSidebar}
              type="button"
            >
              <PanelRightOpen className="size-4" />
              Open panel
            </button>
          ) : null}
        </section>

        {!isSidebarCollapsed ? (
          <button
            aria-label="Resize sidebar"
            className="group relative hidden w-3 shrink-0 cursor-col-resize items-stretch justify-center bg-transparent xl:flex"
            onPointerDown={handleStartSidebarResize}
            type="button"
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-emerald-200/10 transition group-hover:bg-emerald-200/22" />
            <span className="absolute left-1/2 top-1/2 inline-flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200/10 bg-[#08392d]/88 text-white/60 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition group-hover:text-white">
              <GripVertical className="size-4 text-emerald-50/76" />
            </span>
          </button>
        ) : null}

        <aside
          className={cn(
            "flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-t border-emerald-200/10 bg-[linear-gradient(180deg,rgba(9,61,49,0.98),rgba(8,47,39,0.98))] xl:border-l xl:border-t-0",
            isSidebarCollapsed ? "pointer-events-none border-l-0 border-t-0 opacity-0" : "opacity-100",
            isResizingSidebar ? "" : "transition-[width] duration-200 ease-out",
          )}
          style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
          aria-hidden={isSidebarCollapsed}
        >
          <div className="shrink-0 border-b border-emerald-200/10 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Structured canvas
                </p>
                <h1 className="mt-1 text-sm font-semibold tracking-[-0.03em] text-white">
                  {rootNode?.title ?? "Untitled workspace"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={validation.is_valid ? "success" : "warning"}>
                  {validation.is_valid ? "Ready" : "Review"}
                </Badge>
                <button
                  className="inline-flex size-9 items-center justify-center rounded-full border border-emerald-200/10 bg-emerald-300/6 text-white/68 transition hover:bg-emerald-300/10 hover:text-white"
                  onClick={handleCollapseSidebar}
                  type="button"
                >
                  <PanelRightClose className="size-4" />
                </button>
              </div>
            </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-1 text-xs text-white/62">
                    {nodes.length} nodes
              </div>
              <div className="rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-1 text-xs text-white/62">
                {edges.length} edges
              </div>
              {ingestMode ? (
                <div className="rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-1 text-xs text-white/62">
                  {ingestMode}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 border-b border-emerald-200/10 bg-[#08392d]/72">
            {([
              ["diagram", "Diagram"],
              ["copilot", "Copilot"],
            ] as const).map(([value, label]) => (
              <button
                className={cn(
                  "border-b-2 px-3 py-3 text-sm font-semibold transition",
                  sidebarTab === value
                    ? "border-white text-white"
                    : "border-transparent text-white/46 hover:text-white/74",
                )}
                key={value}
                onClick={() => setSidebarTab(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {sidebarTab === "diagram" ? (
            <div className="workspace-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 pr-4 overscroll-contain">
              <div className="grid gap-3">
                <SidebarSection title="Validation">
                  {validation.is_valid ? (
                    <div className="rounded-2xl border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-50">
                      The DAG is structurally valid. Complete branches can be exported once they reach Rank 6.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-lime-300/18 bg-lime-300/10 px-4 py-3 text-sm leading-6 text-lime-50">
                        {validation.issues.length} validation issue(s) are blocking export. Fix the items below in the canvas before continuing.
                      </div>

                      {validation.issues.map((issue, index) => {
                        const linkedNode = issue.node_id
                          ? nodeMap.get(issue.node_id) ?? null
                          : null;
                        const canJumpToNode = Boolean(linkedNode);
                        const isMultipleRootIssue = issue.code === "multiple_roots";

                        return (
                          <div
                            className="rounded-2xl border border-emerald-200/10 bg-emerald-300/6 p-3"
                            key={`${issue.code}-${issue.node_id ?? issue.edge_id ?? index}`}
                          >
                            <p className="text-sm font-semibold text-white">{issue.message}</p>
                            <p className="mt-2 text-xs leading-5 text-white/58">
                              {linkedNode
                                ? `Linked node: ${linkedNode.title}`
                                : isMultipleRootIssue
                                  ? `Current roots: ${rootNodes.map((node) => truncate(node.title, 24)).join(" • ")}`
                                  : issue.edge_id
                                    ? `Edge reference: ${issue.edge_id}`
                                    : "Review the graph and restore a single connected Rank 1 to Rank 6 structure."}
                            </p>
                            {canJumpToNode ? (
                              <Button
                                className="mt-3 w-full"
                                onClick={() => {
                                  if (linkedNode) {
                                    handleSelectNode(linkedNode.id);
                                  }
                                }}
                                variant="secondary"
                              >
                                Inspect linked node
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SidebarSection>

                <SidebarSection title="Selection">
                  {selectedNode ? (
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-emerald-200/10 bg-emerald-300/6 px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                              Rank {selectedNode.rank}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {selectedRankDefinition?.title}
                            </p>
                          </div>
                          <Badge tone="subtle">{selectedNode.source}</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/50">
                          {selectedRankDefinition?.description}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Node title</FieldLabel>
                        <Input
                          onChange={(event) => setNodeTitle(event.target.value)}
                          value={nodeTitle}
                        />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Node content</FieldLabel>
                        <Textarea
                          className="min-h-32"
                          onChange={(event) => setNodeContent(event.target.value)}
                          value={nodeContent}
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button className="w-full" disabled={isPending} onClick={handleSaveNode} variant="secondary">
                          Save node
                        </Button>
                        <Button
                          className="w-full"
                          disabled={isPending}
                          onClick={() => handlePrepareChildNode(selectedNode.id)}
                        >
                          <Plus className="size-4" />
                          Add next
                        </Button>
                        <Button
                          className="w-full sm:col-span-2"
                          disabled={isPending}
                          onClick={() => handleDeleteNode(selectedNode.id)}
                          variant="danger"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-emerald-200/12 bg-emerald-300/5 px-4 py-8 text-sm text-white/58">
                      No node selected yet.
                    </div>
                  )}
                </SidebarSection>

                <SidebarSection title="AI frameworks">
                  {frameworkContext ? (
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-emerald-300/14 bg-emerald-300/8 px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <FieldLabel>Anchor hypothesis</FieldLabel>
                            <p className="mt-2 break-words text-sm font-semibold text-white">
                              {frameworkContext.anchorNode.title}
                            </p>
                          </div>
                          <Badge tone="success">Rank 4</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/58">
                          Suggestions are generated from the closest hypothesis in the
                          selected branch so the framework stays aligned to the DAG.
                        </p>
                      </div>

                      {frameworkSuggestions.map((suggestion) => (
                        <div
                          className="rounded-2xl border border-emerald-200/10 bg-emerald-300/6 p-3"
                          key={suggestion.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {suggestion.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-white/56">
                                {suggestion.summary}
                              </p>
                            </div>
                            <Badge tone="subtle">{suggestion.tag}</Badge>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-white/62">
                            {suggestion.why}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {suggestion.analysisPrompts.slice(0, 2).map((prompt) => (
                              <div
                                className="rounded-full border border-emerald-200/10 bg-[#083327]/72 px-2.5 py-1 text-[11px] text-white/62"
                                key={prompt}
                              >
                                {prompt}
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 rounded-xl border border-emerald-200/10 bg-[#083327]/72 px-3 py-2.5">
                            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                              Evidence cues
                            </p>
                            <div className="mt-2 grid gap-1">
                              {suggestion.evidencePrompts.slice(0, 2).map((cue) => (
                                <p
                                  className="text-xs leading-5 text-white/58"
                                  key={cue}
                                >
                                  • {cue}
                                </p>
                              ))}
                            </div>
                          </div>

                          <Button
                            className="mt-3 w-full"
                            disabled={isPending}
                            onClick={() => handleApplyFrameworkSuggestion(suggestion)}
                          >
                            <Sparkles className="size-4" />
                            {selectedNode?.rank === 4
                              ? "Apply to selected framework"
                              : "Add framework to branch"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-emerald-200/12 bg-emerald-300/5 px-4 py-6 text-sm leading-6 text-white/58">
                      AI framework suggestions unlock after you add or select a
                      Rank 3 hypothesis branch.
                    </div>
                  )}
                </SidebarSection>

                <SidebarSection title="Add node">
                  <div className="grid min-w-0 gap-3">
                    <div className="grid min-w-0 gap-2 rounded-2xl border border-emerald-200/10 bg-emerald-300/6 p-3">
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <FieldLabel>Parent</FieldLabel>
                        {nextRank ? (
                          <Badge tone="subtle">Rank {nextRank}</Badge>
                        ) : null}
                      </div>
                      <NodeSummaryCard
                        body={
                          parentNode
                            ? `Child will be created under Rank ${parentNode.rank}.`
                            : nodes.length === 0
                              ? "A root node will be created at Rank 1."
                              : "Choose which existing node should own the next step."
                        }
                        title={
                          parentNode
                            ? truncate(parentNode.title, 52)
                            : nodes.length === 0
                              ? "Root problem statement"
                              : "No parent selected"
                        }
                        tone={parentNode ? "active" : "default"}
                      />
                      {selectedNode && getNextRank(selectedNode.rank) ? (
                        <button
                          className="w-full min-w-0 whitespace-normal break-words rounded-xl border border-emerald-200/10 bg-[#083327]/72 px-3 py-2 text-left text-xs leading-5 text-white/66 transition hover:bg-emerald-300/10 hover:text-white"
                          onClick={() => setParentNodeId(selectedNode.id)}
                          type="button"
                        >
                          Use selected node: {truncate(selectedNode.title, 42)}
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FieldLabel>Parent node</FieldLabel>
                      <select
                        className="min-h-11 w-full min-w-0 rounded-2xl border border-emerald-200/10 bg-emerald-300/6 px-3 py-2.5 text-sm text-white outline-none"
                        onChange={(event) => setParentNodeId(event.target.value)}
                        value={parentNodeId}
                      >
                        <option className="bg-[#08392d]" value="">
                          {nodes.length === 0 ? "No parent required" : "Select parent node"}
                        </option>
                        {childCandidates.map((node) => (
                          <option className="bg-[#08392d]" key={node.id} value={node.id}>
                            {node.title} · Rank {node.rank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-emerald-200/10 bg-[#083327]/72 px-3 py-2.5 text-xs leading-5 break-words text-white/62">
                      {nextRank
                        ? `The new node will be created at Rank ${nextRank} (${getRankDefinition(nextRank).shortTitle}).`
                        : "Rank 6 nodes cannot create additional children."}
                    </div>

                    <div className="grid gap-2">
                      <FieldLabel>New node title</FieldLabel>
                      <Input
                        className="min-h-11"
                        onChange={(event) => setNewNodeTitle(event.target.value)}
                        placeholder="State the next branch step"
                        value={newNodeTitle}
                      />
                    </div>

                    <div className="grid gap-2">
                      <FieldLabel>Supporting content</FieldLabel>
                      <Textarea
                        className="min-h-24 resize-none"
                        onChange={(event) => setNewNodeContent(event.target.value)}
                        placeholder="Optional evidence cue, analysis note, or synthesis intent"
                        value={newNodeContent}
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={isPending || !nextRank || newNodeTitle.trim().length < 3}
                      onClick={handleAddNode}
                    >
                      <Plus className="size-4" />
                      Add node
                    </Button>
                  </div>
                </SidebarSection>

                <SidebarSection title="Connect">
                  <div className="grid min-w-0 gap-3">
                    <div className="grid min-w-0 gap-2 rounded-2xl border border-emerald-200/10 bg-emerald-300/6 p-3">
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <FieldLabel>Connection path</FieldLabel>
                        {edgeSource && edgeTarget ? (
                          <Badge tone="success">Ready</Badge>
                        ) : (
                          <Badge tone="subtle">Pending</Badge>
                        )}
                      </div>
                      <NodeSummaryCard
                        body={
                          edgeSource
                            ? connectionHint
                            : "Pick a source node first, then choose a valid target in the next rank."
                        }
                        title={
                          edgeSource
                            ? truncate(nodeMap.get(edgeSource)?.title ?? "Source node", 52)
                            : "No source selected"
                        }
                        tone={edgeSource ? "active" : "default"}
                      />
                      {selectedNode && getNextRank(selectedNode.rank) ? (
                        <button
                          className="w-full min-w-0 whitespace-normal break-words rounded-xl border border-emerald-200/10 bg-[#083327]/72 px-3 py-2 text-left text-xs leading-5 text-white/66 transition hover:bg-emerald-300/10 hover:text-white"
                          onClick={() => {
                            setEdgeSource(selectedNode.id);
                            setEdgeTarget("");
                          }}
                          type="button"
                        >
                          Use selected node as source
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FieldLabel>Source node</FieldLabel>
                      <select
                        className="min-h-11 w-full min-w-0 rounded-2xl border border-emerald-200/10 bg-emerald-300/6 px-3 py-2.5 text-sm text-white outline-none"
                        onChange={(event) => {
                          setEdgeSource(event.target.value);
                          setEdgeTarget("");
                        }}
                        value={edgeSource}
                      >
                        <option className="bg-[#08392d]" value="">
                          Select source node
                        </option>
                        {childCandidates.map((node) => (
                          <option className="bg-[#08392d]" key={node.id} value={node.id}>
                            {node.title} · Rank {node.rank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <FieldLabel>Target node</FieldLabel>
                      <select
                        className="min-h-11 w-full min-w-0 rounded-2xl border border-emerald-200/10 bg-emerald-300/6 px-3 py-2.5 text-sm text-white outline-none"
                        onChange={(event) => setEdgeTarget(event.target.value)}
                        value={edgeTarget}
                      >
                        <option className="bg-[#08392d]" value="">
                          Select target node
                        </option>
                        {targetOptions.map((node) => (
                          <option className="bg-[#08392d]" key={node.id} value={node.id}>
                            {node.title} · Rank {node.rank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-emerald-200/10 bg-[#083327]/72 px-3 py-2.5 text-xs leading-5 break-words text-white/62">
                      {edgeTarget
                        ? `Target ready: ${truncate(nodeMap.get(edgeTarget)?.title ?? "Selected target", 48)}`
                        : connectionHint}
                    </div>

                    <Button
                      disabled={isPending || !edgeSource || !edgeTarget}
                      className="w-full"
                      onClick={handleManualEdge}
                      variant="secondary"
                    >
                      <Link2 className="size-4" />
                      Connect nodes
                    </Button>
                  </div>
                </SidebarSection>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 py-3">
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-emerald-200/10 bg-[#072e24]/72">
                {workspace.chat.messages.length > 0 ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="workspace-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 pr-2 overscroll-contain">
                      <div className="flex flex-col gap-3">
                        {workspace.chat.messages.map((message) => (
                          <MessageCard key={message.id} message={message} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/50">
                    Ask the copilot to refine a branch, add evidence, or tighten the synthesis.
                  </div>
                )}
              </div>

              <div className="mt-3 shrink-0 border-t border-emerald-200/10 pt-3">
                <div className="grid gap-3">
                  <Textarea
                    className="min-h-20 resize-none"
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask copilot to refine a branch, add evidence, or tighten the synthesis."
                    value={chatInput}
                  />
                  <Button
                    className="w-full"
                    disabled={isPending || chatInput.trim().length < 5}
                    onClick={handleChat}
                  >
                    {isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Bot className="size-4" />
                    )}
                    Send to copilot
                  </Button>
                </div>
              </div>
            </div>
          )}

          {sidebarTab === "diagram" ? (
            <div className="shrink-0 border-t border-emerald-200/10 px-3 py-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  disabled={isPending || nodes.length === 0}
                  onClick={handleAutoLayout}
                  variant="secondary"
                >
                  <RefreshCcw className="size-4" />
                  Auto-layout
                </Button>
                <Link href={`/export/preview/${workspace.project_id}`}>
                  <Button className="w-full">
                    <LayoutPanelTop className="size-4" />
                    Export preview
                  </Button>
                </Link>
                <Button className="w-full" onClick={handleExportGraphPdf} variant="secondary">
                  <Download className="size-4" />
                  Graph PDF
                </Button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[18px] border border-emerald-200/10 bg-[#072f25]/72 p-3">
      <div className="mb-3">
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">
      {children}
    </label>
  );
}

function NodeSummaryCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "default" | "active";
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border px-3 py-3",
        tone === "active"
          ? "border-emerald-300/18 bg-emerald-300/8"
          : "border-emerald-200/10 bg-[#083327]/72",
      )}
    >
      <p className="break-words text-sm font-semibold leading-6 text-white">{title}</p>
      <p className="mt-1 break-words text-xs leading-5 text-white/56">{body}</p>
    </div>
  );
}

function MessageCard({ message }: { message: WorkspaceChatMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <article
        className={cn(
          "min-w-0 max-w-[92%] rounded-[18px] border px-3.5 py-3",
          isAssistant
            ? "border-emerald-300/16 bg-emerald-300/8"
            : "border-emerald-200/10 bg-emerald-300/6",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
            {isAssistant ? "Copilot" : "You"}
          </p>
          {message.applied_commands.length > 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/10 bg-emerald-300/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/58">
              <MoveRight className="size-3" />
              {message.applied_commands.length}
            </div>
          ) : null}
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/68">
          {message.content}
        </p>
      </article>
    </div>
  );
}
