import { BillingResultPage } from "@/src/features/billing/billing-result-page";

export default function BillingCancelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BillingResultPage searchParams={searchParams} state="cancel" />;
}
