import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { requireAuthSession } from "@/src/lib/auth/session";
import { getBillingSummary } from "@/src/lib/billing/server";
import { formatDateTime } from "@/src/lib/utils";

export default async function BillingPage() {
  const session = await requireAuthSession("/billing");
  const summary = await getBillingSummary(session);
  const isPro = summary.plan === "pro";

  return (
    <AppShell
      description="Protected billing dashboard for subscription state, current plan visibility, and upgrade entry points."
      eyebrow="Billing"
      initialSession={session}
      title="Billing and subscription"
    >
      <div className="grid gap-6">
        <Panel className="rounded-[30px] border border-emerald-200/16 bg-[radial-gradient(circle_at_top_right,rgba(121,248,154,0.14),transparent_32%),linear-gradient(180deg,rgba(173,255,207,0.08),rgba(255,255,255,0.015)),rgba(10,95,78,0.42)] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-2 text-sm font-semibold text-white">
                <CreditCard className="size-4" />
                {summary.provider === "mock" ? "Mock billing" : "Midtrans billing"}
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                {summary.planLabel}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/66 md:text-base">
                This page is the protected frontend surface for plan state,
                payment outcomes, and upgrade actions after authentication.
              </p>
            </div>
            <div className="rounded-[24px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                Subscription status
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {summary.subscriptionStatus}
              </p>
              <p className="mt-1 text-sm text-white/58">
                {summary.customerEmail}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isPro ? (
              <>
                <Link href="/dashboard">
                  <Button>
                    Open dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary">
                    Review pricing
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/pricing?checkout=pro">
                <Button>
                  <Sparkles className="size-4" />
                  Upgrade to Pro
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            )}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="The billing summary returned by the frontend billing integration."
              eyebrow="Summary"
              title="Current subscription"
            />
            <div className="mt-6 grid gap-3">
              {[
                ["Plan", summary.planLabel],
                ["Status", summary.subscriptionStatus],
                ["Provider", summary.provider],
                [
                  "Renews",
                  summary.renewsAt ? formatDateTime(summary.renewsAt) : "Unavailable",
                ],
                [
                  "Next billing",
                  summary.nextBillingAt
                    ? formatDateTime(summary.nextBillingAt)
                    : "Unavailable",
                ],
              ].map(([label, value]) => (
                <div
                  className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                  key={label}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="rounded-[30px] p-5 md:p-6">
            <PanelHeader
              description="Effective frontend entitlements that should align with the plan-aware actor claims sent to the backend."
              eyebrow="Entitlements"
              title="What the frontend carries"
            />
            <div className="mt-6 grid gap-3">
              {summary.entitlements.length > 0 ? (
                summary.entitlements.map((item) => (
                  <div
                    className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4 text-sm font-semibold text-white"
                    key={item}
                  >
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4 text-sm leading-6 text-white/64">
                  No explicit paid entitlements are surfaced yet. The frontend
                  still exposes plan-aware navigation, pricing, and billing states.
                </div>
              )}

              <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4 text-sm leading-6 text-white/64">
                <div className="inline-flex items-center gap-2 font-semibold text-white">
                  <ShieldCheck className="size-4" />
                  Integration note
                </div>
                <p className="mt-2">
                  After a successful payment, the billing summary can update
                  before the auth session badge refreshes. If your backend sync
                  writes plan fields back into Better Auth, the header will align after refresh.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
