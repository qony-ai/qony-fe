"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Presentation } from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import type { AuthSession } from "@/src/lib/auth/types";
import { browserApi } from "@/src/lib/api/client";
import { QonyApiError } from "@/src/lib/api/core";
import type {
  DeliverableType,
  ExportPreviewPayload,
  ExportSlideStep,
} from "@/src/lib/types/api";
import { formatDateTime } from "@/src/lib/utils";

interface ExportPreviewViewProps {
  initialSession?: AuthSession | null;
  preview: ExportPreviewPayload;
}

interface PreviewSection {
  id: string;
  componentLabel: string;
  points: string[];
  sourceCount: number;
  summary: string;
  title: string;
}

const deliverableOptions: Array<{
  description: string;
  icon: typeof Presentation;
  label: string;
  value: DeliverableType;
}> = [
  {
    value: "pitch_deck",
    label: "Pitch deck",
    description: "A4 landscape deck with slide rhythm",
    icon: Presentation,
  },
  {
    value: "business_document",
    label: "Business document",
    description: "A4 portrait narrative with section flow",
    icon: FileText,
  },
];

export function ExportPreviewView({
  initialSession = null,
  preview,
}: ExportPreviewViewProps) {
  const sections = useMemo(() => buildSections(preview), [preview]);
  const deliverableType = preview.deliverable_type ?? "pitch_deck";
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null;

  useEffect(() => {
    setActiveSectionId(sections[0]?.id ?? "");
  }, [preview.snapshot_id, sections]);

  async function handleExportPdf() {
    setIsExporting(true);
    setExportError(null);
    try {
      const job = await browserApi.createExportJob({
        project_id: preview.project_id,
        deliverable_type: deliverableType,
      });
      const link = document.createElement("a");
      link.href = `/api/qony-export/jobs/${job.id}/pdf`;
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
    } catch (error) {
      setExportError(
        error instanceof QonyApiError
          ? error.message
          : "Export failed. Check the backend renderer and try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppShell
      actions={
        <>
          <Link href={`/project/${preview.project_id}`}>
            <Button variant="secondary">Back to project</Button>
          </Link>
          <Link href={`/export/graph/${preview.project_id}`}>
            <Button variant="secondary">Graph PDF</Button>
          </Link>
          {deliverableOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                href={`/export/preview/${preview.project_id}?deliverable_type=${option.value}`}
                key={option.value}
              >
                <Button
                  variant={deliverableType === option.value ? "primary" : "secondary"}
                >
                  <Icon className="size-4" />
                  {option.label}
                </Button>
              </Link>
            );
          })}
          <Button disabled={isExporting} onClick={handleExportPdf}>
            <Download className="size-4" />
            {isExporting ? "Rendering PDF..." : "Export PDF"}
          </Button>
        </>
      }
      description="Review the actual component plan that will be rendered into the final PDF, then export the current workspace as a deck or business document."
      eyebrow="Export preview"
      hideHeroOnPrint
      initialSession={initialSession}
      title={`${preview.project_name} export`}
    >
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description={`Generated ${formatDateTime(preview.generated_at)}.`}
            eyebrow="Component plan"
            title={`${sections.length} sections ready`}
          />

          <div className="mt-6 grid gap-3">
            {sections.map((section, index) => (
              <button
                className={`rounded-[24px] border p-4 text-left transition ${
                  activeSectionId === section.id
                    ? "border-emerald-300/24 bg-emerald-300/10"
                    : "border-emerald-200/10 bg-emerald-300/6 hover:bg-emerald-300/10"
                }`}
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                type="button"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                  {deliverableType === "pitch_deck" ? "Slide" : "Section"} {index + 1}
                </p>
                <p className="mt-3 text-sm font-semibold text-white">{section.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  {section.componentLabel}
                </p>
              </button>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={preview.warnings.length > 0 ? "warning" : "success"}>
                    {preview.status === "stub" ? "Preview stub" : "Preview ready"}
                  </Badge>
                  <Badge tone="subtle">
                    {deliverableType === "pitch_deck" ? "A4 landscape" : "A4 portrait"}
                  </Badge>
                </div>
              }
              description="This preview is generated from the same component library and slide plan used by the export job."
              eyebrow="Active section"
              title={activeSection?.title ?? "No section available"}
            />

            <div className="mt-8 rounded-[28px] border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(134,255,138,0.08),rgba(46,230,191,0.04))] p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="subtle">{activeSection?.componentLabel ?? "No component"}</Badge>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/6 px-3 py-1 text-xs text-white/62">
                  {deliverableType === "pitch_deck" ? (
                    <Presentation className="size-3.5" />
                  ) : (
                    <FileText className="size-3.5" />
                  )}
                  {deliverableType === "pitch_deck" ? "Deck-style output" : "Document-style output"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/6 px-3 py-1 text-xs text-white/62">
                  {activeSection?.sourceCount ?? 0} source nodes
                </div>
              </div>
              <div className="mt-8 max-w-3xl">
                <h2 className="text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                  {activeSection?.title ?? "Export plan unavailable"}
                </h2>
                <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-white/66 md:text-lg">
                  {activeSection?.summary ??
                    "The export engine needs at least one planned section before it can render a document."}
                </p>
              </div>
              {activeSection?.points.length ? (
                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  {activeSection.points.map((point) => (
                    <div
                      className="rounded-[22px] border border-emerald-200/10 bg-[#082b22]/34 px-4 py-3 text-sm leading-6 text-white/74"
                      key={point}
                    >
                      {point}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Panel className="rounded-[30px] p-5 md:p-6">
              <PanelHeader
                description="Each export uses the shared manifest and current graph version, so the preview and final PDF stay aligned."
                eyebrow="Export metadata"
                title="Render contract"
              />
              <div className="mt-6 grid gap-3">
                <div className="rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Deliverable
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {deliverableOptions.find((option) => option.value === deliverableType)?.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/58">
                    {
                      deliverableOptions.find((option) => option.value === deliverableType)
                        ?.description
                    }
                  </p>
                </div>
                <div className="rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Manifest
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {preview.manifest_version ?? "Unknown"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Graph version
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {preview.graph_version != null ? `v${preview.graph_version}` : "Unknown"}
                  </p>
                </div>
                {exportError ? (
                  <div className="rounded-[22px] border border-lime-300/18 bg-lime-300/10 px-4 py-3 text-sm leading-6 text-lime-50">
                    {exportError}
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel className="rounded-[30px] p-5 md:p-6">
              <PanelHeader
                description="Warnings are surfaced before export so weak branches or sparse evidence do not silently make it into the PDF."
                eyebrow="Quality gates"
                title="Pre-export checks"
              />
              <div className="mt-6 grid gap-3">
                {preview.warnings.length > 0 ? (
                  preview.warnings.map((warning) => (
                    <div
                      className="rounded-[22px] border border-lime-300/18 bg-lime-300/10 px-4 py-3 text-sm leading-6 text-lime-50"
                      key={warning}
                    >
                      {warning}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-emerald-300/18 bg-emerald-300/10 px-4 py-4 text-sm text-emerald-50">
                    The current graph has no blocking export warnings.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function buildSections(preview: ExportPreviewPayload): PreviewSection[] {
  const steps = preview.slide_plan?.steps ?? [];
  if (steps.length === 0) {
    return [
      {
        id: "fallback",
        componentLabel: "Export overview",
        points: preview.warnings,
        sourceCount: 0,
        summary:
          "The export preview does not have any planned sections yet. Add more structure to the workspace graph and refresh the preview.",
        title: "Export overview",
      },
    ];
  }

  return steps.map((step, index) => ({
    id: `${step.component_key}-${index}`,
    componentLabel: humanizeComponentKey(step.component_key),
    points: collectStepPoints(step),
    sourceCount: step.source_node_ids.length,
    summary: summarizeStep(step),
    title: step.title,
  }));
}

function summarizeStep(step: ExportSlideStep) {
  const stringValues = Object.values(step.variables).filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  if (stringValues.length > 0) {
    return stringValues.slice(0, 2).join("\n\n");
  }
  return `Rendered from ${humanizeComponentKey(step.component_key)} using ${step.source_node_ids.length} linked graph nodes.`;
}

function collectStepPoints(step: ExportSlideStep) {
  const points: string[] = [];

  for (const value of Object.values(step.variables)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 0) {
          points.push(item);
        } else if (isRecord(item)) {
          const title = readString(item.title);
          const description = readString(item.description);
          const mitigation = readString(item.mitigation);
          points.push(
            [title, description, mitigation ? `Mitigation: ${mitigation}` : null]
              .filter(Boolean)
              .join(" • "),
          );
        }
      }
    }
  }

  return points.slice(0, 8);
}

function humanizeComponentKey(componentKey: string) {
  const [, rawLabel = componentKey] = componentKey.split(".");
  return rawLabel.replaceAll("_", " ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
