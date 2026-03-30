import { BillingResultPage } from "@/src/features/billing/billing-result-page";

export default function BillingPendingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BillingResultPage searchParams={searchParams} state="pending" />;
}
