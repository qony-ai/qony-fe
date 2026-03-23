"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Presentation } from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import type { ExportPreviewPayload } from "@/src/lib/types/api";
import { formatDateTime } from "@/src/lib/utils";

interface ExportPreviewViewProps {
  preview: ExportPreviewPayload;
}

interface PreviewSlide {
  id: string;
  title: string;
  kicker: string;
  body: string;
}

export function ExportPreviewView({ preview }: ExportPreviewViewProps) {
  const slides = useMemo(() => buildSlides(preview), [preview]);
  const [activeSlideId, setActiveSlideId] = useState(slides[0]?.id ?? "");
  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? slides[0] ?? null;

  function handleExportPdf() {
    window.print();
  }

  return (
    <AppShell
      hideHeroOnPrint
      actions={
        <>
          <Link href={`/project/${preview.project_id}`}>
            <Button variant="secondary">Back to project</Button>
          </Link>
          <Link href={`/export/graph/${preview.project_id}`}>
            <Button variant="secondary">Graph PDF</Button>
          </Link>
          <Button onClick={handleExportPdf}>
            <Download className="size-4" />
            Export PDF
          </Button>
        </>
      }
      description="Review the slide rhythm, tighten branch narratives, and confirm the export is ready for a deck or written report."
      eyebrow="Export preview"
      title="Narrative preview"
    >
      <div className="print-hidden print-sheet grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description={`Generated ${formatDateTime(preview.generated_at)}.`}
            eyebrow="Slide rail"
            title={`${slides.length} preview slides`}
          />

          <div className="mt-6 grid gap-3">
            {slides.map((slide, index) => (
              <button
                className={`content-auto rounded-[24px] border p-4 text-left transition ${
                  activeSlideId === slide.id
                    ? "border-emerald-300/24 bg-emerald-300/10"
                    : "border-emerald-200/10 bg-emerald-300/6 hover:bg-emerald-300/10"
                }`}
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                type="button"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Slide {index + 1}
                </p>
                <p className="mt-3 text-sm font-semibold text-white">{slide.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">{slide.kicker}</p>
              </button>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              action={
                <Badge tone={preview.branch_count > 0 ? "success" : "warning"}>
                  {preview.branch_count} exportable branches
                </Badge>
              }
              description="This central panel mirrors the final report composition: headline, narrative kicker, and the branch body."
              eyebrow="Active slide"
              title={activeSlide?.title ?? "No exportable branch yet"}
            />

            <div className="mt-8 rounded-[28px] border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(134,255,138,0.08),rgba(46,230,191,0.04))] p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="subtle">{activeSlide?.kicker ?? "Waiting for completed branch"}</Badge>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-300/6 px-3 py-1 text-xs text-white/62">
                  <Presentation className="size-3.5" />
                  Deck-style output
                </div>
              </div>
              <div className="mt-8 max-w-3xl">
                <h2 className="text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                  {activeSlide?.title ?? "Complete one branch to unlock the preview."}
                </h2>
                <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-white/66 md:text-lg">
                  {activeSlide?.body ??
                    "Use the workspace to build a full rank-1 through rank-6 branch, then return here to review the narrative output."}
                </p>
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <Panel className="rounded-[30px] p-5 md:p-6">
              <PanelHeader
                description="The summary should read like an executive preamble ahead of the full deck."
                eyebrow="Narrative"
                title="Executive synopsis"
              />
              <div className="mt-6 rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-5">
                <p className="text-sm leading-7 text-white/62">
                  {preview.narrative ??
                    "No narrative summary is available yet. Complete more branches to enrich the export story."}
                </p>
              </div>
            </Panel>

            <Panel className="rounded-[30px] p-5 md:p-6">
              <PanelHeader
                description="Warnings are surfaced before export to avoid weak slides or missing synthesis."
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
                    The current preview has no blocking warnings. Review slide copy and export when ready.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <div className="print-only">
        <div className="print-deck">
          {slides.map((slide, index) => (
            <article className="print-slide" key={`print-${slide.id}`}>
              <div className="print-slide-meta">
                <span>Qony AI export</span>
                <span>
                  Slide {index + 1} of {slides.length}
                </span>
              </div>
              <p className="print-slide-kicker">{slide.kicker}</p>
              <h2 className="print-slide-title">{slide.title}</h2>
              <div className="print-slide-body">
                {slide.body.split("\n").map((line, lineIndex) => (
                  <p key={`${slide.id}-${lineIndex}`}>{line}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function buildSlides(preview: ExportPreviewPayload): PreviewSlide[] {
  const baseSlides: PreviewSlide[] = [
    {
      id: "overview",
      kicker: `${preview.branch_count} complete branches • ${formatDateTime(preview.generated_at)}`,
      title: "Report overview",
      body:
        preview.narrative ??
        "This preview will expand as the workspace accumulates complete branches and stronger synthesis.",
    },
  ];

  const branchSlides = preview.chains.map((chain, index) => ({
    id: chain.chain_id,
    kicker: `Branch ${index + 1} • ${chain.steps.length} slides of logic`,
    title: chain.steps[chain.steps.length - 1]?.title ?? `Branch ${index + 1}`,
    body: chain.steps
      .map(
        (step) =>
          `Rank ${step.rank} · ${step.kind.replaceAll("_", " ")}\n${step.title}\n${step.content ?? "No additional content."}`,
      )
      .join("\n\n"),
  }));

  return [...baseSlides, ...branchSlides];
}
