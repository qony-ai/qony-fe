import { AppShell } from "@/src/components/layout/app-shell";
import { BillingResultView } from "@/src/features/billing/billing-result-view";
import { getBillingPaymentStatus, getBillingSummary } from "@/src/lib/billing/server";
import { requireAuthSession } from "@/src/lib/auth/session";

function buildSearchParams(
  value: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      params.set(key, entry);
      continue;
    }

    if (Array.isArray(entry)) {
      for (const item of entry) {
        params.append(key, item);
      }
    }
  }

  return params;
}

export async function BillingResultPage({
  searchParams,
  state,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  state: "cancel" | "failed" | "pending" | "success";
}) {
  const session = await requireAuthSession(`/billing/${state}`);
  const resolvedSearchParams = await searchParams;
  const params = buildSearchParams(resolvedSearchParams);
  const [summary, snapshot] = await Promise.all([
    getBillingSummary(session),
    getBillingPaymentStatus(session, params),
  ]);

  return (
    <AppShell
      description="User-facing billing return state after the Midtrans checkout flow."
      eyebrow="Billing result"
      initialSession={session}
      title={state === "success" ? "Payment completed" : "Billing update"}
    >
      <BillingResultView snapshot={snapshot} state={state} summary={summary} />
    </AppShell>
  );
}
