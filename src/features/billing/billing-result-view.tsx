import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import type {
  BillingSummary,
  PaymentStatusSnapshot,
} from "@/src/lib/billing/types";
import { formatDateTime } from "@/src/lib/utils";

const stateMeta = {
  cancel: {
    description:
      "The payment window was closed before completion. You can retry when you are ready.",
    icon: XCircle,
    title: "Checkout canceled",
  },
  failed: {
    description:
      "Midtrans returned a failed or denied payment state. Review the payment details and retry when appropriate.",
    icon: AlertTriangle,
    title: "Payment failed",
  },
  pending: {
    description:
      "The payment is still waiting for final settlement. The billing page will keep reflecting the latest status.",
    icon: Clock3,
    title: "Payment pending",
  },
  success: {
    description:
      "The payment finished successfully. Refreshing the billing page should show the updated subscription state once backend sync is complete.",
    icon: CheckCircle2,
    title: "Payment successful",
  },
} as const;

export function BillingResultView({
  snapshot,
  state,
  summary,
}: {
  snapshot: PaymentStatusSnapshot;
  state: keyof typeof stateMeta;
  summary: BillingSummary;
}) {
  const meta = stateMeta[state];
  const Icon = meta.icon;

  return (
    <div className="grid gap-6">
      <Panel className="rounded-[30px] border border-emerald-200/16 bg-[radial-gradient(circle_at_top_right,rgba(121,248,154,0.14),transparent_32%),linear-gradient(180deg,rgba(173,255,207,0.08),rgba(255,255,255,0.015)),rgba(10,95,78,0.42)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-2 text-sm font-semibold text-white">
              <Icon className="size-4" />
              {meta.title}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
              {meta.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/66 md:text-base">
              {meta.description}
            </p>
          </div>
          <div className="rounded-[24px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
              Current plan
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.planLabel}
            </p>
            <p className="mt-1 text-sm text-white/58">
              Status: {summary.subscriptionStatus}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/billing">
            <Button>
              Open billing
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary">
              Compare plans
            </Button>
          </Link>
          {state !== "success" ? (
            <Link href="/pricing?checkout=pro">
              <Button variant="outline">
                <RotateCcw className="size-4" />
                Retry upgrade
              </Button>
            </Link>
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Normalized frontend status after the billing callback or status fetch."
            eyebrow="Payment snapshot"
            title="What the frontend knows"
          />
          <div className="mt-6 grid gap-3">
            {[
              ["Plan", snapshot.plan.toUpperCase()],
              ["Frontend status", snapshot.status],
              ["Provider status", snapshot.providerStatus ?? "Unavailable"],
              ["Payment ID", snapshot.paymentId],
              ["Order ID", snapshot.orderId],
              [
                "Updated",
                snapshot.updatedAt
                  ? formatDateTime(snapshot.updatedAt)
                  : "Just now",
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
            description="The billing page remains the canonical frontend surface for plan status after payment."
            eyebrow="Next step"
            title="Recommended follow-up"
          />
          <div className="mt-6 grid gap-3 text-sm leading-7 text-white/66">
            <p>
              Open billing to confirm the latest subscription summary and make
              sure the plan badge, payment state, and upgrade controls all look
              correct.
            </p>
            <p>
              If your backend sync updates the Better Auth user session, the
              header plan state should align with the billing summary after a refresh.
            </p>
            <p>
              If the result is pending, keep the billing page bookmarked and
              refresh the status once the provider finalizes settlement.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
