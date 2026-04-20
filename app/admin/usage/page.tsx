import { AppShell } from "@/src/components/layout/app-shell";
import { UsageStats } from "@/components/admin/UsageStats";
import { requireAuthSession } from "@/src/lib/auth/session";
import { serverApi } from "@/src/lib/api/server";
import { QonyApiError } from "@/src/lib/api/core";
import type { AdminMetricsRead } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const session = await requireAuthSession("/admin/usage");
  let metrics: AdminMetricsRead | null = null;

  try {
    metrics = await serverApi.getAdminMetrics();
  } catch (error) {
    if (!(error instanceof QonyApiError && error.status === 403)) {
      throw error;
    }
  }

  return (
    <AppShell eyebrow="Admin" title="Usage" description="Track uploads, scraping, AI edits, and exports." initialSession={session}>
      <UsageStats
        items={[
          { label: "Uploads", value: metrics?.upload_count ?? 0 },
          { label: "Scrapes", value: metrics?.scrape_count ?? 0 },
          { label: "AI edits", value: metrics?.ai_edit_count ?? 0 },
          { label: "Exports", value: metrics?.export_count ?? 0 },
        ]}
      />
    </AppShell>
  );
}
