"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";

import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { AuthSession } from "@/src/lib/auth/types";
import {
  pricingComparison,
  pricingFaq,
  pricingPlans,
} from "@/src/lib/billing/config";
import type {
  BillingCheckoutResponse,
  BillingPlanCode,
  BillingSummary,
  PaymentFlowStatus,
} from "@/src/lib/billing/types";

import { MidtransSnapScript } from "./midtrans-snap-script";

function buildBillingPath(
  state: "cancel" | "failed" | "pending" | "success",
  checkout: BillingCheckoutResponse,
  result?: Record<string, unknown>,
) {
  const params = new URLSearchParams({
    order_id:
      (typeof result?.order_id === "string" && result.order_id) ||
      checkout.orderId,
    payment_id:
      (typeof result?.transaction_id === "string" && result.transaction_id) ||
      checkout.paymentId,
    plan: checkout.plan,
    provider:
      (typeof result?.provider === "string" && result.provider) ||
      checkout.provider,
    status:
      (typeof result?.transaction_status === "string" &&
        result.transaction_status) ||
      state,
  });

  return `/billing/${state}?${params.toString()}`;
}

async function parseCheckoutResponse(response: Response) {
  const payload = (await response.json()) as {
    data?: BillingCheckoutResponse;
    error?: { message?: string };
  };

  if (!response.ok || !payload.data) {
    throw new Error(
      payload.error?.message || "Unable to start the payment flow.",
    );
  }

  return payload.data;
}

export function PricingPageClient({
  autoCheckoutPlan,
  initialSession,
  initialSummary,
  midtransClientKey,
  midtransIsProduction,
}: {
  autoCheckoutPlan: BillingPlanCode | null;
  initialSession: AuthSession | null;
  initialSummary: BillingSummary | null;
  midtransClientKey: string | null;
  midtransIsProduction: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<{
    message: string | null;
    state: PaymentFlowStatus;
  }>({ message: null, state: "initial" });
  const [snapReady, setSnapReady] = useState(false);
  const [queuedCheckout, setQueuedCheckout] =
    useState<BillingCheckoutResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoCheckoutStarted = useRef(false);

  const session = initialSession;
  const summary = initialSummary;
  const activePlan = summary?.plan ?? session?.plan ?? "free";
  const shouldLoadMidtrans = Boolean(
    session && activePlan !== "pro" && midtransClientKey,
  );

  useEffect(() => {
    if (!queuedCheckout || !snapReady || !window.snap || !queuedCheckout.snapToken) {
      return;
    }

    const checkout = queuedCheckout;
    const snapToken = checkout.snapToken;
    if (!snapToken) {
      return;
    }

    setQueuedCheckout(null);
    setStatus({
      message: "Opening secure Midtrans checkout...",
      state: "redirecting",
    });

    window.snap.pay(snapToken, {
      onClose: () => {
        router.push(buildBillingPath("cancel", checkout));
      },
      onError: (result) => {
        router.push(buildBillingPath("failed", checkout, result));
      },
      onPending: (result) => {
        router.push(buildBillingPath("pending", checkout, result));
      },
      onSuccess: (result) => {
        router.push(buildBillingPath("success", checkout, result));
      },
    });
  }, [queuedCheckout, router, snapReady]);

  useEffect(() => {
    if (
      !autoCheckoutPlan ||
      autoCheckoutStarted.current ||
      !session ||
      activePlan === "pro"
    ) {
      return;
    }

    autoCheckoutStarted.current = true;
    triggerAutoCheckout(autoCheckoutPlan);
  }, [activePlan, autoCheckoutPlan, session]);

  function redirectGuest(plan: BillingPlanCode) {
    router.push(`/register?next=${encodeURIComponent(`/pricing?checkout=${plan}`)}`);
  }

  async function handleUpgrade(plan: BillingPlanCode) {
    if (!session) {
      redirectGuest(plan);
      return;
    }

    setStatus({
      message: "Requesting a secure checkout session...",
      state: "loading",
    });

    startTransition(async () => {
      try {
        const response = await parseCheckoutResponse(
          await fetch("/api/billing/checkout", {
            body: JSON.stringify({
              plan,
              source: "pricing",
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          }),
        );

        if (response.redirectUrl && !response.snapToken) {
          setStatus({
            message: "Redirecting to the payment flow...",
            state: "redirecting",
          });

          if (/^https?:\/\//.test(response.redirectUrl)) {
            window.location.assign(response.redirectUrl);
            return;
          }

          router.push(response.redirectUrl);
          return;
        }

        if (!response.snapToken) {
          throw new Error(
            response.message || "Checkout token was not returned by billing.",
          );
        }

        setQueuedCheckout(response);
        setStatus({
          message: snapReady
            ? "Opening secure Midtrans checkout..."
            : "Preparing secure payment window...",
          state: "redirecting",
        });
      } catch (error) {
        setStatus({
          message:
            error instanceof Error
              ? error.message
              : "Unable to start the payment flow.",
          state: "failed",
        });
      }
    });
  }

  const triggerAutoCheckout = useEffectEvent((plan: BillingPlanCode) => {
    void handleUpgrade(plan);
  });

  return (
    <>
      <MidtransSnapScript
        clientKey={midtransClientKey}
        enabled={shouldLoadMidtrans}
        isProduction={midtransIsProduction}
        onError={() =>
          setStatus({
            message:
              "Midtrans secure checkout could not be loaded. Check the public client key or retry.",
            state: "failed",
          })
        }
        onReady={() => setSnapReady(true)}
      />

      <div className="grid gap-6">
        <Panel className="rounded-[30px] border border-emerald-200/16 bg-[radial-gradient(circle_at_top_right,rgba(121,248,154,0.14),transparent_32%),linear-gradient(180deg,rgba(173,255,207,0.08),rgba(255,255,255,0.015)),rgba(10,95,78,0.42)] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <Badge tone="subtle">Pricing & Billing</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                Choose the plan that fits the maturity of your analysis workflow.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/66 md:text-base">
                The Free plan gets you into the full typed graph flow. Pro
                adds a more polished billing posture, premium-ready output, and
                the paid subscription path surfaced through Midtrans.
              </p>
            </div>
            <div className="rounded-[24px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                Current plan
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {activePlan === "pro" ? "Qony Pro" : "Qony Free"}
              </p>
              <p className="mt-1 text-sm text-white/58">
                {session
                  ? `Signed in as ${session.email}`
                  : "Sign in to unlock upgrade checkout."}
              </p>
            </div>
          </div>

          {status.message ? (
            <div className="mt-6 rounded-[24px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-4 text-sm leading-6 text-white/76">
              <div className="inline-flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="size-4" />
                Billing state
              </div>
              <p className="mt-2">{status.message}</p>
            </div>
          ) : null}
        </Panel>

        <section className="grid gap-6 xl:grid-cols-2">
          {pricingPlans.map((plan) => {
            const isCurrentPlan = activePlan === plan.code;
            const isPaidPlan = plan.code === "pro";

            return (
              <Panel
                className={
                  plan.featured
                    ? "rounded-[32px] border border-emerald-300/22 bg-[radial-gradient(circle_at_top_left,rgba(121,248,154,0.18),transparent_34%),linear-gradient(180deg,rgba(173,255,207,0.08),rgba(255,255,255,0.015)),rgba(10,95,78,0.42)] p-6 md:p-8"
                    : "rounded-[32px] p-6 md:p-8"
                }
                key={plan.code}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-50/48">
                      {plan.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                      {plan.code === "pro" ? "Qony Pro" : "Qony Free"}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-white/62">
                      {plan.description}
                    </p>
                  </div>
                  {plan.badge ? <Badge tone="subtle">{plan.badge}</Badge> : null}
                </div>

                <div className="mt-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-semibold tracking-[-0.06em] text-white">
                      {plan.price}
                    </p>
                    <p className="mt-2 text-sm text-white/58">{plan.billing}</p>
                  </div>
                  <div className="rounded-[22px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-3 text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                      Best for
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {plan.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3">
                  {plan.bullets.map((bullet) => (
                    <div
                      className="flex items-start gap-3 rounded-[22px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                      key={bullet}
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-6 text-white/72">{bullet}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {isPaidPlan ? (
                    isCurrentPlan ? (
                      <Link href="/billing">
                        <Button>
                          <CreditCard className="size-4" />
                          Open billing
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        disabled={isPending}
                        onClick={() => handleUpgrade(plan.code)}
                      >
                        <Sparkles className="size-4" />
                        {session ? plan.cta : "Sign in to upgrade"}
                        <ArrowRight className="size-4" />
                      </Button>
                    )
                  ) : isCurrentPlan ? (
                    <Button disabled variant="secondary">
                      Current plan
                    </Button>
                  ) : (
                    <Link href="/dashboard">
                      <Button variant="secondary">
                        Go to dashboard
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  )}

                  <p className="text-sm text-white/54">
                    {isPaidPlan
                      ? session
                        ? "Upgrade opens a secure Midtrans checkout."
                        : "Auth-aware upgrade returns here after sign in."
                      : "Free access keeps the core product flow open."}
                  </p>
                </div>
              </Panel>
            );
          })}
        </section>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="A quick plan matrix so the paid tier feels clear before the user commits to checkout."
            eyebrow="Comparison"
            title="Feature comparison"
          />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-4 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Capability
                  </th>
                  <th className="px-4 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Free
                  </th>
                  <th className="px-4 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingComparison.map((row) => (
                  <tr key={row.feature}>
                    <td className="rounded-l-[18px] border border-r-0 border-emerald-200/10 bg-emerald-300/4 px-4 py-4 text-sm font-semibold text-white">
                      {row.feature}
                    </td>
                    <td className="border border-r-0 border-emerald-200/10 bg-emerald-300/4 px-4 py-4 text-sm text-white/66">
                      {row.free}
                    </td>
                    <td className="rounded-r-[18px] border border-emerald-200/10 bg-emerald-300/4 px-4 py-4 text-sm text-white/66">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Short plan notes to remove ambiguity around the frontend-side billing integration."
            eyebrow="FAQ"
            title="Billing notes"
          />
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {pricingFaq.map((item) => (
              <div
                className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                key={item.question}
              >
                <p className="text-sm font-semibold text-white">{item.question}</p>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
