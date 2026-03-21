"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { browserApi } from "@/src/lib/api/client";
import type {
  AddEdgeCommand,
  AddNodeCommand,
  GraphNode,
  NodeRank,
  Position,
  WorkspaceChatMessage,
  WorkspaceMutationRequest,
  WorkspacePayload,
} from "@/src/lib/types/api";

interface WorkspaceClientProps {
  initialWorkspace: WorkspacePayload;
}

const rankOptions: Array<{ value: NodeRank; label: string }> = [
  { value: 1, label: "1 Problem Statement" },
  { value: 2, label: "2 Sub-Problem" },
  { value: 3, label: "3 Hypothesis" },
  { value: 4, label: "4 Framework / Analysis" },
  { value: 5, label: "5 Supporting Data / Evidence" },
  { value: 6, label: "6 Synthesis" },
];
const orderedRanks: NodeRank[] = [1, 2, 3, 4, 5, 6];
const graphLaneWidth = 240;
const graphColumnGap = 20;

export function WorkspaceClient({ initialWorkspace }: WorkspaceClientProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [nodeTitle, setNodeTitle] = useState("");
  const [nodeContent, setNodeContent] = useState("");
  const [nodeRank, setNodeRank] = useState<NodeRank>(2);
  const [parentId, setParentId] = useState("");
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialWorkspace.graph.nodes[0]?.id ?? null,
  );

  const nodes = workspace.graph.nodes;
  const chatMessages = workspace.chat.messages;
  const validation = workspace.graph.metadata.validation;
  const ingestMode = readStringAttribute(
    workspace.graph.metadata.attributes.ingest_mode,
  );
  const providerAttempted = readStringAttribute(
    workspace.graph.metadata.attributes.provider_attempted,
  );
  const isStubWorkspace = ingestMode?.startsWith("stub") ?? false;
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const graphBoard = useMemo(() => buildGraphBoard(nodes), [nodes]);
  const selectedNode =
    (selectedNodeId ? nodeMap.get(selectedNodeId) : null) ?? nodes[0] ?? null;

  function submitMutation(payload: WorkspaceMutationRequest) {
    startTransition(async () => {
      try {
        const response = await browserApi.mutateWorkspace(payload);
        const nextNodeMap = new Map(
          response.graph.nodes.map((node) => [node.id, node]),
        );
        setWorkspace((currentWorkspace) => ({
          ...currentWorkspace,
          project_id: response.project_id,
          workspace_id: response.workspace_id,
          graph: response.graph,
        }));
        setSelectedNodeId((currentId) => {
          if (currentId && nextNodeMap.has(currentId)) {
            return currentId;
          }
          return response.graph.nodes[0]?.id ?? null;
        });
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Workspace mutation failed.",
        );
      }
    });
  }

  function handleAddNode() {
    const commands: WorkspaceMutationRequest["commands"] = [
      {
        type: "add_node",
        node: {
          rank: nodeRank,
          title: nodeTitle,
          content: nodeContent,
          source: "manual",
          position: buildSuggestedPosition(nodeMap.get(parentId) ?? null, nodeRank),
        },
      } satisfies AddNodeCommand,
    ];

    if (parentId) {
      commands.push({
        type: "add_edge",
        edge: {
          source: parentId,
          target: "__pending__",
        },
      } as AddEdgeCommand);
    }

    if (parentId) {
      const addNode = commands[0] as AddNodeCommand;
      const tempNodeId = crypto.randomUUID();
      addNode.node.id = tempNodeId;
      (commands[1] as AddEdgeCommand).edge.target = tempNodeId;
    }

    submitMutation({
      project_id: workspace.project_id,
      expected_version: workspace.graph.metadata.version,
      actor: "user",
      reason: "Manual workspace edit",
      commands,
    });

    setNodeTitle("");
    setNodeContent("");
  }

  function handleAddEdge() {
    submitMutation({
      project_id: workspace.project_id,
      expected_version: workspace.graph.metadata.version,
      actor: "user",
      reason: "Manual edge creation",
      commands: [
        {
          type: "add_edge",
          edge: { source: edgeSource, target: edgeTarget },
        },
      ],
    });
  }

  function handleDeleteNode(nodeId: string) {
    submitMutation({
      project_id: workspace.project_id,
      expected_version: workspace.graph.metadata.version,
      actor: "user",
      reason: "Node deletion",
      commands: [{ type: "delete_node", node_id: nodeId }],
    });
  }

  function handleAiPatch() {
    startTransition(async () => {
      try {
        const response = await browserApi.chatWorkspace({
          project_id: workspace.project_id,
          expected_version: workspace.graph.metadata.version,
          message: chatInput,
        });
        const nextNodeMap = new Map(
          response.graph.nodes.map((node) => [node.id, node]),
        );
        setWorkspace({
          project_id: response.project_id,
          workspace_id: response.workspace_id,
          graph: response.graph,
          chat: response.chat,
        });
        setSelectedNodeId((currentId) => {
          if (currentId && nextNodeMap.has(currentId)) {
            return currentId;
          }
          return response.graph.nodes[0]?.id ?? null;
        });
        setChatInput("");
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Workspace chat failed.",
        );
      }
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Workspace</h1>
          <p className="text-sm text-zinc-600">
            Project {workspace.project_id} · version {workspace.graph.metadata.version}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            href={`/export/preview/${workspace.project_id}`}
          >
            Export Preview
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="text-lg font-medium">Validation</h2>
        <p className="mt-2 text-sm">
          {validation.is_valid ? "Graph is valid." : "Graph has validation issues."}
        </p>
        {ingestMode ? (
          <p className="mt-2 text-sm text-zinc-600">Ingest mode: {ingestMode}</p>
        ) : null}
        {isStubWorkspace ? (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Workspace ini dibentuk dari deterministic fallback, bukan output
            Ollama yang berhasil.
            {providerAttempted ? ` Provider yang dicoba: ${providerAttempted}.` : ""}
            Struktur node akan tetap generik sampai backend dijalankan dengan
            `QONY_AI_PROVIDER=ollama`, direstart, lalu project di-ingest ulang
            dengan replace existing aktif.
          </p>
        ) : null}
        {validation.issues.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
            {validation.issues.map((issue) => (
              <li key={`${issue.code}-${issue.node_id ?? issue.edge_id ?? issue.message}`}>
                {issue.code}: {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Graph</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {nodes.length} nodes · {workspace.graph.edges.length} edges ·{" "}
              {validation.complete_branch_count} complete branches
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Klik node untuk buka detail content.
          </p>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            {nodes.length > 0 ? (
              <GraphBoard
                board={graphBoard}
                selectedNodeId={selectedNode?.id ?? null}
                onSelectNode={setSelectedNodeId}
              />
            ) : (
              <p className="text-sm text-zinc-600">No nodes in this workspace yet.</p>
            )}
          </div>
          <NodeInspector
            disabled={isPending}
            node={selectedNode}
            onDelete={handleDeleteNode}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
        <section className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-medium">Add Node</h2>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={nodeRank}
              onChange={(event) => setNodeRank(Number(event.target.value) as NodeRank)}
            >
              {rankOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">No parent edge</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Node title"
              value={nodeTitle}
              onChange={(event) => setNodeTitle(event.target.value)}
            />
            <textarea
              className="min-h-32 rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Node content"
              value={nodeContent}
              onChange={(event) => setNodeContent(event.target.value)}
            />
            <button
              className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
              disabled={isPending || !nodeTitle.trim()}
              onClick={handleAddNode}
              type="button"
            >
              Add node
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-medium">Add Edge</h2>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={edgeSource}
              onChange={(event) => setEdgeSource(event.target.value)}
            >
              <option value="">Select source node</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={edgeTarget}
              onChange={(event) => setEdgeTarget(event.target.value)}
            >
              <option value="">Select target node</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
            <button
              className="w-fit rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50"
              disabled={isPending || !edgeSource || !edgeTarget}
              onClick={handleAddEdge}
              type="button"
            >
              Add edge
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-medium">Workspace Chat</h2>
          <div className="mt-4 flex min-h-[320px] flex-col gap-3">
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {chatMessages.length > 0 ? (
                <div className="grid gap-3">
                  {chatMessages.map((message) => (
                    <ChatMessageBubble key={message.id} message={message} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Belum ada chat. Minta AI ubah graph, tambah node, rapikan branch,
                  atau buat synthesis.
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <textarea
                className="min-h-32 rounded-md border border-zinc-300 px-3 py-2"
                placeholder="Contoh: pecah sub-problem ini jadi dua hypothesis terpisah lalu tambahkan synthesis singkat."
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <button
                className="w-fit rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50"
                disabled={isPending || chatInput.trim().length < 5}
                onClick={handleAiPatch}
                type="button"
              >
                Send to AI
              </button>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-medium">Latest Chat Summary</h2>
          <div className="mt-4 grid gap-3">
            {chatMessages.length > 0 ? (
              <ChatSummaryCard
                message={
                  [...chatMessages]
                    .reverse()
                    .find((message) => message.role === "assistant") ?? null
                }
              />
            ) : (
              <p className="text-sm text-zinc-500">
                Summary perubahan AI akan muncul di sini setelah chat pertama.
              </p>
            )}
          </div>
        </section>
        <NodeInspector
          disabled={isPending}
          node={selectedNode}
          onDelete={handleDeleteNode}
        />
      </section>

      <details className="rounded-xl border border-zinc-200 p-4">
        <summary className="cursor-pointer text-lg font-medium">
          Raw Graph JSON
        </summary>
        <pre className="mt-4 overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
          {JSON.stringify(workspace.graph, null, 2)}
        </pre>
      </details>
    </main>
  );
}

function ChatMessageBubble({ message }: { message: WorkspaceChatMessage }) {
  const isAssistant = message.role === "assistant";
  const action = readStringAttribute(message.metadata.action);
  const provider = readStringAttribute(message.metadata.provider);
  const requestPayload = readRecordAttribute(message.metadata.request_payload);
  const responsePayload = readRecordAttribute(message.metadata.response_payload);

  return (
    <article
      className="rounded-xl border p-3"
      style={{
        backgroundColor: isAssistant ? "#fff7ed" : "#ffffff",
        borderColor: isAssistant ? "#fdba74" : "#d4d4d8",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          {isAssistant ? "AI Summary" : "You"}
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {action ? <span>{action}</span> : null}
          {provider ? <span>{provider}</span> : null}
          <span>{message.applied_commands.length} graph changes</span>
        </div>
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-700">
        {message.content}
      </p>
      {isAssistant && (requestPayload || responsePayload) ? (
        <details className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            LLM JSON Details
          </summary>
          {requestPayload ? (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Request Payload
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                {JSON.stringify(requestPayload, null, 2)}
              </pre>
            </div>
          ) : null}
          {responsePayload ? (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Response Payload
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                {JSON.stringify(responsePayload, null, 2)}
              </pre>
            </div>
          ) : null}
        </details>
      ) : null}
    </article>
  );
}

function ChatSummaryCard({ message }: { message: WorkspaceChatMessage | null }) {
  if (!message) {
    return null;
  }

  return (
    <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Assistant Summary
      </p>
      <p className="mt-3 text-sm whitespace-pre-wrap text-zinc-700">
        {message.content}
      </p>
      {message.applied_commands.length > 0 ? (
        <p className="mt-3 text-xs text-zinc-500">
          Applied: {message.applied_commands.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

interface BoardNodePlacement {
  lane: number;
  node: GraphNode;
}

interface GraphBoardRow {
  rank: NodeRank;
  title: string;
  nodes: BoardNodePlacement[];
}

interface GraphBoardData {
  laneCount: number;
  rows: GraphBoardRow[];
}

function GraphBoard({
  board,
  onSelectNode,
  selectedNodeId,
}: {
  board: GraphBoardData;
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
}) {
  return (
    <div
      className="min-w-max"
      style={{
        width:
          board.laneCount * graphLaneWidth +
          Math.max(0, board.laneCount - 1) * graphColumnGap,
      }}
    >
      <div className="flex flex-col gap-5">
        {board.rows.map((row, rowIndex) => (
          <section key={row.rank} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                Rank {row.rank}
              </span>
              <p className="text-sm text-zinc-600">{row.title}</p>
            </div>
            <div
              className="grid items-start gap-y-4"
              style={{
                columnGap: `${graphColumnGap}px`,
                gridTemplateColumns: `repeat(${board.laneCount}, ${graphLaneWidth}px)`,
              }}
            >
              {row.nodes.map(({ lane, node }) => (
                <div
                  key={node.id}
                  style={{
                    gridColumn: `${lane + 1}`,
                  }}
                >
                  <GraphNodeCard
                    isSelected={selectedNodeId === node.id}
                    node={node}
                    onSelect={onSelectNode}
                  />
                </div>
              ))}
            </div>
            {rowIndex < board.rows.length - 1 ? (
              <div
                className="grid items-center"
                style={{
                  columnGap: `${graphColumnGap}px`,
                  gridTemplateColumns: `repeat(${board.laneCount}, ${graphLaneWidth}px)`,
                }}
              >
                {buildConnectorLanes({
                  currentRow: row,
                  nextRow: board.rows[rowIndex + 1],
                }).map((lane) => (
                  <div
                    key={`${row.rank}-${lane}`}
                    className="flex h-8 justify-center"
                    style={{ gridColumn: `${lane + 1}` }}
                  >
                    <div className="h-full w-px bg-zinc-300" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function GraphNodeCard({
  node,
  onSelect,
  isSelected,
}: {
  node: GraphNode;
  onSelect: (nodeId: string) => void;
  isSelected: boolean;
}) {
  return (
    <button
      className="flex w-full flex-col items-start rounded-xl p-3 text-left shadow-sm transition"
      onClick={() => onSelect(node.id)}
      style={{
        backgroundColor: isSelected ? "#fef3c7" : "#ffffff",
        border: isSelected ? "2px solid #f59e0b" : "1px solid #d4d4d8",
        color: "#111827",
        minHeight: "112px",
      }}
      type="button"
    >
      <p
        className="text-xs font-medium uppercase tracking-[0.18em]"
        style={{ color: isSelected ? "#b45309" : "#71717a" }}
      >
        {node.kind.replaceAll("_", " ")} · rank {node.rank}
      </p>
      <h3 className="mt-2 text-sm font-semibold">{node.title}</h3>
      <p className="mt-3 text-xs" style={{ color: "#52525b" }}>
        {node.content ? truncateText(node.content, 64) : "No content"}
      </p>
    </button>
  );
}

function NodeInspector({
  node,
  disabled,
  onDelete,
}: {
  node: GraphNode | null;
  disabled: boolean;
  onDelete: (nodeId: string) => void;
}) {
  if (!node) {
    return (
      <aside className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="text-lg font-medium">Node Detail</h3>
        <p className="mt-3 text-sm text-zinc-600">
          Pilih satu node di graph untuk lihat content lengkapnya.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {node.kind} · rank {node.rank}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-950">{node.title}</h3>
        </div>
        <button
          className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
          disabled={disabled}
          onClick={() => onDelete(node.id)}
          type="button"
        >
          Delete
        </button>
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-zinc-600">
        <div className="flex items-center justify-between gap-3">
          <dt>Source</dt>
          <dd className="font-medium text-zinc-900">{node.source}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Position</dt>
          <dd className="font-medium text-zinc-900">
            {Math.round(node.position.x)}, {Math.round(node.position.y)}
          </dd>
        </div>
      </dl>
      {node.content ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Content
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-700">
            {node.content}
          </p>
        </div>
      ) : null}
      {Object.keys(node.metadata ?? {}).length > 0 ? (
        <details className="mt-4 rounded-lg border border-zinc-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Metadata
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
            {JSON.stringify(node.metadata, null, 2)}
          </pre>
        </details>
      ) : null}
    </aside>
  );
}

function buildSuggestedPosition(
  parent: GraphNode | null,
  rank: NodeRank,
): Position {
  if (!parent) {
    return { x: 0, y: (rank - 1) * 200 };
  }

  return {
    x: parent.position.x,
    y: parent.position.y + 200,
  };
}

function buildGraphBoard(nodes: GraphNode[]): GraphBoardData {
  const groups = new Map<NodeRank, GraphNode[]>();
  for (const rank of orderedRanks) {
    groups.set(rank, []);
  }

  for (const node of nodes) {
    groups.get(node.rank)?.push(node);
  }

  for (const group of groups.values()) {
    group.sort(
      (left, right) =>
        compareBranchIndex(
          readBranchIndex(left.metadata.branch_index),
          readBranchIndex(right.metadata.branch_index),
        ) ||
        left.position.x - right.position.x ||
        left.position.y - right.position.y ||
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id),
    );
  }

  const explicitLaneMax = Math.max(
    0,
    ...nodes.map((node) => readBranchIndex(node.metadata.branch_index) ?? -1),
  );
  const laneCount = Math.max(
    1,
    explicitLaneMax + 1,
    ...orderedRanks.map((rank) => groups.get(rank)?.length ?? 0),
  );
  const rows: GraphBoardRow[] = [];

  orderedRanks.forEach((rank) => {
    const group = groups.get(rank) ?? [];
    const usedLanes = new Set<number>();
    const explicitLaneMap = new Map<string, number>();

    group.forEach((node) => {
      const lane = readBranchIndex(node.metadata.branch_index);
      if (lane === null || rank === 1) {
        return;
      }
      explicitLaneMap.set(node.id, lane);
      usedLanes.add(lane);
    });

    let nextLane = 0;
    const placedNodes: BoardNodePlacement[] = [];
    group.forEach((node, nodeIndex) => {
      let lane = explicitLaneMap.get(node.id) ?? null;
      if (lane === null) {
        while (usedLanes.has(nextLane)) {
          nextLane += 1;
        }
        lane = rank === 1 && group.length === 1 ? 0 : nextLane;
        usedLanes.add(lane);
      }
      placedNodes.push({
        lane,
        node,
      });
      if (rank === 1 && group.length > 1) {
        nextLane = nodeIndex + 1;
      }
    });
    if (rank === 1 && placedNodes.length === 1) {
      placedNodes[0] = {
        lane: Math.floor((laneCount - 1) / 2),
        node: placedNodes[0].node,
      };
    }
    rows.push({
      rank,
      title: rankOptions.find((option) => option.value === rank)?.label ?? `Rank ${rank}`,
      nodes: placedNodes,
    });
  });

  return { laneCount, rows };
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars - 1).trimEnd()}...`;
}

function readStringAttribute(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readRecordAttribute(
  value: unknown,
): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readBranchIndex(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compareBranchIndex(left: number | null, right: number | null): number {
  if (left === right) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  return left - right;
}

function buildConnectorLanes({
  currentRow,
  nextRow,
}: {
  currentRow: GraphBoardRow;
  nextRow: GraphBoardRow;
}): number[] {
  const nextLanes = nextRow.nodes.map((item) => item.lane);
  if (currentRow.rank === 1) {
    return nextLanes;
  }
  const currentLaneSet = new Set(currentRow.nodes.map((item) => item.lane));
  return nextLanes.filter((lane) => currentLaneSet.has(lane));
}
