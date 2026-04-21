import Link from "next/link";
import {
  ArrowRight,
  Brain,
  ChartColumn,
  CircleCheckBig,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import { SiteFooter } from "@/src/components/layout/site-footer";
import { SiteHeader } from "@/src/components/layout/site-header";
import type { AuthSession } from "@/src/lib/auth/types";

const featureCards = [
  {
    icon: Brain,
    title: "Structured Reasoning Engine",
    body: "Turn raw material into a structured logic map instead of starting from a blank page.",
  },
  {
    icon: Sparkles,
    title: "Smart Visualizer",
    body: "Generate readable connected branches, not messy freeform whiteboards.",
  },
  {
    icon: ChartColumn,
    title: "Guided Analysis",
    body: "Move from hypothesis to framework to evidence with visible branch discipline.",
  },
  {
    icon: TrendingUp,
    title: "Exportable Synthesis",
    body: "Convert complete branches into report and deck-ready previews faster.",
  },
];

const workflowCards = [
  {
    title: "Layered node structure",
    body: "Every branch follows the same analytical ladder: problem, sub-problem, hypothesis, framework, evidence, synthesis.",
  },
  {
    title: "AI copilot patches the graph",
    body: "The assistant proposes actual node and edge changes, not just chat text.",
  },
  {
    title: "Canvas quality with constraints",
    body: "The workspace behaves like a diagram tool, but it never lets logic collapse into chaos.",
  },
];

export function getLandingDestinations(session: AuthSession | null) {
  return {
    primary: session ? "/dashboard" : "/register?next=%2Fdashboard",
    secondary: session ? "/project/ingest" : "/login?next=%2Fproject%2Fingest",
  };
}

export function LandingPage({
  initialSession = null,
}: {
  initialSession?: AuthSession | null;
}) {
  const destinations = getLandingDestinations(initialSession);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(121,248,154,0.12),transparent_20%),radial-gradient(circle_at_top_right,rgba(22,224,201,0.14),transparent_24%),linear-gradient(180deg,#063c2f_0%,#0d5e50_34%,#0b5b4d_66%,#084337_100%)]">
      <SiteHeader initialSession={initialSession} />

      <main>
        <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2">
              <span className="text-sm font-semibold text-emerald-300">
                AI-Powered Structured Analysis Platform
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">
              Analyze Like the Way
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                You Never Before!
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-xl text-white/74">
              Transform complex problems and case data into a structured
              workspace. Qony AI turns unstructured inputs into readable logic,
              branch relationships, and export-ready synthesis.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={destinations.primary}>
                <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:from-emerald-600 hover:to-teal-600">
                  Start Analyzing Now
                  <ArrowRight className="size-5" />
                </button>
              </Link>
              <Link href={destinations.secondary}>
                <button className="rounded-full border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(84,146,121,0.24),rgba(21,75,58,0.32))] px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-[linear-gradient(180deg,rgba(98,168,140,0.28),rgba(24,88,67,0.36))]">
                  Open Ingest Flow
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,rgba(4,36,28,0.14),rgba(7,67,54,0.22))] px-4 py-20 sm:px-6 lg:px-8" id="problem">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                The Problem
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-white/74">
                Unstructured problem-solving creates noise, rework, and weak synthesis.
              </p>
            </div>

            <div className="mb-12 grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
                    <Zap className="size-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Overwhelmed analysts</h3>
                </div>
                <ul className="space-y-3 text-white/74">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-400">•</span>
                    <span>Teams lose time re-structuring raw notes, decks, and documents by hand.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-400">•</span>
                    <span>Freeform whiteboards make branches hard to review and even harder to export.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 p-8 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-teal-500/20">
                    <Brain className="size-6 text-teal-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Weak strategic flow</h3>
                </div>
                <ul className="space-y-3 text-white/74">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-teal-400">•</span>
                    <span>Hypotheses, evidence, and synthesis often get mixed into one messy surface.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-teal-400">•</span>
                    <span>Decision-ready narratives break when the underlying branch logic is not explicit.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/12 bg-gradient-to-r from-emerald-300/14 to-teal-300/14 p-8 text-center backdrop-blur-sm">
              <h3 className="mb-2 text-3xl font-bold text-white">Why it matters</h3>
              <p className="mb-2 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-5xl font-bold text-transparent">
                Structure drives speed
              </p>
              <p className="text-xl text-white/74">
                Teams move faster when reasoning is visible, branch-safe, and exportable.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8" id="features">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                What We Offer
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-white/74">
                Qony AI combines structured logic, workspace quality, and export-ready storytelling in one flow.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    className="rounded-2xl border border-emerald-200/10 bg-emerald-300/6 p-6 backdrop-blur-sm transition hover:-translate-y-2 hover:border-emerald-300/26 hover:bg-emerald-300/10"
                    key={card.title}
                  >
                    <div className="mb-4 flex size-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400">
                      <Icon className="size-8" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white">{card.title}</h3>
                    <p className="text-white/58">{card.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,rgba(4,36,28,0.14),rgba(7,67,54,0.22))] px-4 py-20 sm:px-6 lg:px-8" id="solution">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
                  Unlock a cleaner reasoning workflow
                </h2>
                <p className="mb-8 text-xl text-white/74">
                  The product keeps the reference site’s premium momentum, but
                  makes every section about actual problem-solving flow.
                </p>
                <div className="space-y-4">
                  {workflowCards.map((card) => (
                    <div className="flex items-start gap-3" key={card.title}>
                      <CircleCheckBig className="mt-1 size-6 shrink-0 text-emerald-400" />
                      <div>
                        <p className="text-lg font-semibold text-white">{card.title}</p>
                        <p className="mt-1 text-white/72">{card.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={destinations.primary}>
                  <button className="mt-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:from-emerald-600 hover:to-teal-600">
                    See Qony in Action
                  </button>
                </Link>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-8 backdrop-blur-sm">
                <div className="flex min-h-96 flex-col items-center justify-center rounded-xl bg-emerald-950/50 p-8 text-center">
                  <Sparkles className="mx-auto mb-4 size-16 text-emerald-400" />
                  <h3 className="mb-2 text-2xl font-bold text-white">The Others</h3>
                  <p className="text-white/52">Chats, notes, and disconnected whiteboards</p>
                  <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                  <Brain className="mx-auto mb-4 size-20 text-teal-400" />
                  <h3 className="mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-3xl font-bold text-transparent">
                    Qony AI
                  </h3>
                  <p className="text-white/74">
                    One structured workspace from ingest to export preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8" id="market">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                Structured Workflow
              </h2>
              <p className="text-xl text-white/74">
                One coherent product flow for serious case work
              </p>
            </div>
            <div className="mb-12 grid gap-8 md:grid-cols-3">
              {[
                ["01", "Ingest", "Upload PDFs or paste raw context"],
                ["02", "Workspace", "Refine the graph with copilot support"],
                ["03", "Export", "Review deck-style narrative preview"],
              ].map(([value, title, body]) => (
                <div
                  className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 text-center backdrop-blur-sm"
                  key={title}
                >
                  <p className="mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-5xl font-bold text-transparent">
                    {value}
                  </p>
                  <p className="mb-2 text-xl font-semibold text-white">{title}</p>
                  <p className="text-white/58">{body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-12 text-center backdrop-blur-sm">
              <h3 className="mb-4 text-3xl font-bold text-white">Built for serious AI productivity</h3>
              <p className="mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-6xl font-bold text-transparent">
                Structured Graph
              </p>
              <p className="text-xl text-white/74">
                Structured logic, premium workspace interaction, and cleaner export quality
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-12 text-center">
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="relative">
                <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                  Ready to Analyze Smarter?
                </h2>
                <p className="mb-8 text-xl text-white/90">
                  Move from raw case material to structured synthesis in one product flow.
                </p>
                <Link href="/dashboard">
                  <button className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-700 shadow-xl transition hover:scale-105 hover:bg-emerald-50">
                    Get Early Access
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
