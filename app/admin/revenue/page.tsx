import { AppShell } from "@/src/components/layout/app-shell";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { requireAuthSession } from "@/src/lib/auth/session";
import { serverApi } from "@/src/lib/api/server";
import { QonyApiError } from "@/src/lib/api/core";
import type { AdminMetricsRead } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const session = await requireAuthSession("/admin/revenue");
  let metrics: AdminMetricsRead | null = null;

  try {
    metrics = await serverApi.getAdminMetrics();
  } catch (error) {
    if (!(error instanceof QonyApiError && error.status === 403)) {
      throw error;
    }
  }

  return (
    <AppShell eyebrow="Admin" title="Revenue" description="Monitor Midtrans-backed payment activity." initialSession={session}>
      <RevenueChart exportCount={metrics?.export_count ?? 0} projectCount={metrics?.project_count ?? 0} userCount={metrics?.user_count ?? 0} />
    </AppShell>
  );
}
