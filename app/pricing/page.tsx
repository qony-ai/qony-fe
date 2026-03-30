import { AppShell } from "@/src/components/layout/app-shell";
import { PricingPageClient } from "@/src/features/billing/pricing-page-client";
import { getAuthSession } from "@/src/lib/auth/session";
import { getBillingSummary } from "@/src/lib/billing/server";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const session = await getAuthSession();
  const summary = session ? await getBillingSummary(session) : null;

  return (
    <AppShell
      description="Premium plan selection and auth-aware upgrade flow for Qony AI."
      eyebrow="Pricing"
      initialSession={session}
      title="Pricing built for a serious product flow"
    >
      <PricingPageClient
        autoCheckoutPlan={checkout === "pro" ? "pro" : null}
        initialSession={session}
        initialSummary={summary}
        midtransClientKey={
          process.env.NEXT_PUBLIC_QONY_MIDTRANS_CLIENT_KEY ?? null
        }
        midtransIsProduction={process.env.QONY_MIDTRANS_IS_PRODUCTION === "true"}
      />
    </AppShell>
  );
}
