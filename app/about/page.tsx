import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { getAuthSession } from "@/src/lib/auth/session";

export default async function AboutPage() {
  const session = await getAuthSession();

  return (
    <AppShell
      description="Qony AI is built for structured problem-solving: ingest source material, map reasoning inside a six-rank DAG, and export decision-ready output."
      eyebrow="About Qony"
      initialSession={session}
      title="A serious workspace for structured analysis"
    >
      <div className="grid gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="The product is intentionally not a freeform whiteboard. Every branch follows the same analytical ladder so teams can reason, review, and export with less ambiguity."
              eyebrow="Product principle"
              title="Why Qony exists"
            />
            <div className="mt-6 grid gap-4 text-sm leading-7 text-white/64">
              <p>
                Qony AI turns messy case material into a structured workspace
                that moves from problem framing to synthesis without losing the
                logic in between.
              </p>
              <p>
                The core system is a strict six-rank DAG: problem statement,
                sub-problem, hypothesis, framework, supporting evidence, and
                synthesis. That structure makes downstream review and export
                faster because every branch is explicit.
              </p>
            </div>
          </Panel>

          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Each route has one job and the navigation stays predictable."
              eyebrow="Product map"
              title="Primary workflow"
            />
            <div className="mt-6 grid gap-3">
              {[
                "Dashboard to review all cases",
                "Project detail to inspect one case",
                "Ingest to upload or paste context",
                "Canvas to edit the graph",
                "Export preview to review PDF-ready output",
              ].map((item, index) => (
                <div
                  className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                  key={item}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                    Step 0{index + 1}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="This hierarchy is visible in ingest, canvas editing, and export generation."
            eyebrow="Six-rank DAG"
            title="The structure enforced in every case"
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              "Rank 1 · Problem Statement",
              "Rank 2 · Sub-Problem",
              "Rank 3 · Hypothesis",
              "Rank 4 · Framework / Analysis",
              "Rank 5 · Supporting Data / Evidence",
              "Rank 6 · Synthesis",
            ].map((item) => (
              <div
                className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                key={item}
              >
                <Badge tone="subtle">{item.split(" · ")[0]}</Badge>
                <p className="mt-3 text-sm font-semibold text-white">
                  {item.split(" · ")[1]}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
