import { AppShell } from "@/src/components/layout/app-shell";
import { UsageStats } from "@/components/admin/UsageStats";
import { FeatureFlags } from "@/components/admin/FeatureFlags";
import { requireAuthSession } from "@/src/lib/auth/session";
import { serverApi } from "@/src/lib/api/server";
import { QonyApiError } from "@/src/lib/api/core";
import type { AdminMetricsRead, FeatureFlagList } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await requireAuthSession("/admin");
  let metrics: AdminMetricsRead | null = null;
  let flags: FeatureFlagList | null = null;

  try {
    [metrics, flags] = await Promise.all([
      serverApi.getAdminMetrics(),
      serverApi.getAdminFlags(),
    ]);
  } catch (error) {
    if (!(error instanceof QonyApiError && error.status === 403)) {
      throw error;
    }
  }

  return (
    <AppShell
      eyebrow="Admin"
      title="Admin overview"
      description="Operational view for users, revenue, usage, and feature controls."
      initialSession={session}
    >
      <div className="grid gap-6">
        {metrics ? (
          <UsageStats
            items={[
              { label: "Users", value: metrics.user_count },
              { label: "Projects", value: metrics.project_count },
              { label: "Graphs", value: metrics.graph_count },
              { label: "Exports", value: metrics.export_count },
            ]}
          />
        ) : (
          <div className="rounded-[24px] border border-amber-300/18 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
            Admin access is required to read platform metrics.
          </div>
        )}
        <FeatureFlags flags={flags?.items ?? []} />
      </div>
    </AppShell>
  );
}
