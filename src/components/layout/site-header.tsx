import type { AuthSession } from "@/src/lib/auth/types";

import { SiteHeaderClient } from "./site-header-client";

export function SiteHeader({
  compact = false,
  initialSession = null,
}: {
  compact?: boolean;
  initialSession?: AuthSession | null;
}) {
  return <SiteHeaderClient compact={compact} initialSession={initialSession} />;
}
