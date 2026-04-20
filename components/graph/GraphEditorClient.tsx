"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { api } from "@/lib/api";
import { useGraphStore } from "@/lib/graph-store";
import type { AuthSession } from "@/src/lib/auth/types";
import type {
  ExportJobRead,
  KnowledgeGraph,
  KnowledgeNodeCreateRequest,
  KnowledgeRelationType,
  KnowledgeNodeType,
  ProjectDetail,
  ExportType,
} from "@/src/lib/types/api";
import { cn } from "@/src/lib/utils";

import { AddNodeModal } from "./AddNodeModal";
import { AIEditBar } from "./AIEditBar";
import { ExportModal } from "../export/ExportModal";
import { ExportPreview } from "../export/ExportPreview";
import { GraphCanvas } from "./GraphCanvas";
import { NodeSidebar } from "./NodeSidebar";
import { NodeTypeFilter } from "./NodeTypeFilter";
import { ProgressOverlay } from "../ingestion/ProgressOverlay";
import { UploadZone } from "../ingestion/UploadZone";
import { nextNodePosition } from "./catalog";

function backendWebSocketUrl(jobId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  const normalized = baseUrl.replace(/\/$/, "").replace(/^http/, "ws");
  return `${normalized}/api/v1/ws/ingest/${jobId}`;
}

export function GraphEditorClient({
  initialGraph,
  initialSession = null,
  project,
}: {
  initialGraph: KnowledgeGraph;
  initialSession?: AuthSession | null;
  project: ProjectDetail;
}) {
  const {
    edges,
    graphId,
    hiddenTypes,
    nodes,
    selectedNodeId,
    selectNode,
    setGraph,
    setHiddenTypes,
    upsertEdge,
    upsertNode,
    removeNode,
  } = useGraphStore();
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [lastExportJob, setLastExportJob] = useState<ExportJobRead | null>(null);
  const [isMutatingNode, setIsMutatingNode] = useState(false);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ step: string; pct: number } | null>(null);

  useEffect(() => {
    setGraph(initialGraph);
  }, [initialGraph, setGraph]);

  const visibleNodes = useMemo(
    () => nodes.filter((node) => !hiddenTypes.includes(node.type)),
    [hiddenTypes, nodes],
  );
  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
      ),
    [edges, visibleNodeIds],
  );
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  async function refreshGraph() {
    const refreshed = await api.getProjectGraph(project.id);
    setGraph(refreshed);
  }

  async function handleCreateNode(payload: {
    node: KnowledgeNodeCreateRequest;
    connectToSelected: boolean;
    relationType: KnowledgeRelationType;
  }) {
    if (!graphId) {
      return;
    }

    setIsMutatingNode(true);
    setError(null);
    try {
      const createdNode = await api.createNode(graphId, {
        ...payload.node,
        position: nextNodePosition(nodes),
      });
      upsertNode(createdNode);
      selectNode(createdNode.id);

      if (payload.connectToSelected && selectedNodeId) {
        const createdEdge = await api.createEdge(graphId, {
          source: selectedNodeId,
          target: createdNode.id,
          relation_type: payload.relationType,
        });
        upsertEdge(createdEdge);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to create node.",
      );
    } finally {
      setIsMutatingNode(false);
    }
  }

  async function handleSaveNode(draft: {
    title: string;
    description: string | null;
    type: KnowledgeNodeType;
    source: "document" | "web" | "user";
    source_url: string | null;
  }) {
    if (!selectedNode) {
      return;
    }

    setIsMutatingNode(true);
    setError(null);
    try {
      const updated = await api.updateNode(selectedNode.id, {
        description: draft.description,
        source: draft.source,
        source_url: draft.source_url,
        title: draft.title,
        type: draft.type,
      });
      upsertNode(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to save node.",
      );
    } finally {
      setIsMutatingNode(false);
    }
  }

  async function handleDeleteNode() {
    if (!selectedNode) {
      return;
    }

    setIsMutatingNode(true);
    setError(null);
    try {
      await api.deleteNode(selectedNode.id);
      removeNode(selectedNode.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to delete node.",
      );
    } finally {
      setIsMutatingNode(false);
    }
  }

  async function handleAiEdit(prompt: string) {
    if (!graphId) {
      return;
    }

    setIsAiEditing(true);
    setError(null);
    try {
      const response = await api.aiEditGraph(graphId, prompt);
      setGraph(response.graph);
      setAiSummary(response.summary);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to apply AI edit.",
      );
    } finally {
      setIsAiEditing(false);
    }
  }

  async function handleExport(type: ExportType) {
    if (!graphId) {
      return;
    }

    setIsExporting(true);
    setError(null);
    try {
      const job = await api.createExport(graphId, type);
      setLastExportJob(job);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to export graph.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ step: "uploading_file", pct: 5 });

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      const job = await api.ingestProjectFile(project.id, formData);

      await new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(backendWebSocketUrl(job.id));

        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data) as {
            event?: string;
            step?: string;
            pct?: number;
          };

          if (payload.event === "progress" && payload.step && typeof payload.pct === "number") {
            setProgress({ step: payload.step, pct: payload.pct });
          }

          if (payload.event === "complete") {
            socket.close();
            resolve();
          }

          if (payload.event === "failed") {
            socket.close();
            reject(new Error("Ingestion failed."));
          }
        };

        socket.onerror = () => {
          reject(new Error("Unable to connect to the ingestion progress socket."));
        };
      });

      await refreshGraph();
      setSelectedFile(null);
      setProgress({ step: "complete", pct: 100 });
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to run ingestion.",
      );
      setProgress(null);
    } finally {
      setIsUploading(false);
    }
  }

  function toggleType(type: KnowledgeNodeType) {
    setHiddenTypes(
      hiddenTypes.includes(type)
        ? hiddenTypes.filter((item) => item !== type)
        : [...hiddenTypes, type],
    );
  }

  return (
    <AppShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
          <Link href="/project/ingest">
            <Button variant="outline">Open ingest page</Button>
          </Link>
        </div>
      }
      description="Edit a flat typed knowledge graph, enrich it through AI or document ingestion, and export it to PDF on the PRD graph surface."
      eyebrow="Editor"
      initialSession={initialSession}
      title={project.name}
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <GraphCanvas
            edges={visibleEdges}
            nodes={visibleNodes}
            onSelectNode={selectNode}
            selectedNodeId={selectedNodeId}
          />

          <div className="grid gap-6">
            <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
                Project context
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{project.name}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {project.description || "No project description yet."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/38">
                <span>{project.status}</span>
                <span>{nodes.length} nodes</span>
                <span>{edges.length} edges</span>
              </div>
            </div>

            <UploadZone
              file={selectedFile}
              isBusy={isUploading}
              onPickFile={setSelectedFile}
              onSubmit={handleUpload}
            />

            {progress ? <ProgressOverlay pct={progress.pct} step={progress.step} /> : null}

            <NodeTypeFilter hiddenTypes={hiddenTypes} onToggle={toggleType} />
          </div>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          <div className="grid gap-6">
            <AddNodeModal
              isBusy={isMutatingNode}
              onSubmit={handleCreateNode}
              selectedNodeTitle={selectedNode?.title ?? null}
            />
            <ExportModal isBusy={isExporting} lastJob={lastExportJob} onExport={handleExport} />
          </div>

          <div className="grid gap-6">
            <AIEditBar isBusy={isAiEditing} lastSummary={aiSummary} onSubmit={handleAiEdit} />
            <ExportPreview job={lastExportJob} />
          </div>

          <NodeSidebar
            isBusy={isMutatingNode}
            node={selectedNode}
            onDelete={handleDeleteNode}
            onSave={handleSaveNode}
          />
        </div>

        <div
          className={cn(
            "rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5 text-sm leading-7 text-white/66",
            "grid gap-2",
          )}
        >
          <p>Active endpoint contract:</p>
          <p><code>GET /api/v1/projects/{"{project_id}"}/graph</code></p>
          <p><code>POST /api/v1/projects/{"{project_id}"}/ingest</code> + <code>WS /api/v1/ws/ingest/{"{job_id}"}</code></p>
          <p><code>POST /api/v1/nodes/{"{graph_id}"}</code> and <code>POST /api/v1/edges/{"{graph_id}"}</code></p>
          <p><code>POST /api/v1/graphs/{"{graph_id}"}/ai-edit</code> and <code>POST /api/v1/graphs/{"{graph_id}"}/export</code></p>
        </div>
      </div>
    </AppShell>
  );
}
