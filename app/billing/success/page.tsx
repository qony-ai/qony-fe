import { BillingResultPage } from "@/src/features/billing/billing-result-page";

export default function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BillingResultPage searchParams={searchParams} state="success" />;
}
