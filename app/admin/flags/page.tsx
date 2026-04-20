import { AppShell } from "@/src/components/layout/app-shell";
import { FeatureFlags } from "@/components/admin/FeatureFlags";
import { requireAuthSession } from "@/src/lib/auth/session";
import { serverApi } from "@/src/lib/api/server";
import { QonyApiError } from "@/src/lib/api/core";
import type { FeatureFlagList } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function AdminFlagsPage() {
  const session = await requireAuthSession("/admin/flags");
  let flags: FeatureFlagList | null = null;

  try {
    flags = await serverApi.getAdminFlags();
  } catch (error) {
    if (!(error instanceof QonyApiError && error.status === 403)) {
      throw error;
    }
  }

  return (
    <AppShell eyebrow="Admin" title="Feature flags" description="Enable or disable rollout-sensitive capabilities." initialSession={session}>
      <FeatureFlags flags={flags?.items ?? []} />
    </AppShell>
  );
}
