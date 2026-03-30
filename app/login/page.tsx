import Link from "next/link";

import { redirectIfAuthenticated } from "@/src/lib/auth/session";
import { LoginForm } from "@/src/features/auth/login-form";
import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import {
  getConfiguredOAuthProviders,
} from "@/src/lib/auth/server";
import { normalizeNextPath } from "@/src/lib/auth/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = normalizeNextPath(next);
  const oauthProviders = getConfiguredOAuthProviders();
  await redirectIfAuthenticated(nextPath);

  return (
    <AppShell
      description="Sign in with email/password or OAuth to access the Qony workspace, pricing, billing, and structured project flow without session flicker."
      eyebrow="Authentication"
      title="Sign in to Qony AI"
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Use your product account to unlock the protected workspace, billing area, and export flow. Google OAuth appears automatically when it is configured."
            eyebrow="Secure access"
            title="Continue into the workspace"
          />
          <div className="mt-6">
            <LoginForm nextPath={nextPath} providers={oauthProviders} />
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Every protected surface runs inside one authenticated session, so navigation, upgrades, and backend actor identity stay consistent."
            eyebrow="What opens up"
            title="After sign in"
          />
          <div className="mt-6 grid gap-3">
            {[
              "Project dashboard and protected detail routes",
              "Auth-aware pricing and billing with upgrade flow",
              "Fullscreen graph workspace without guest redirects",
              "Export preview and graph output tied to one account",
            ].map((item) => (
              <div
                className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4"
                key={item}
              >
                <Badge tone="subtle">Protected</Badge>
                <p className="mt-3 text-sm font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span>New to Qony?</span>
            <Link
              className="font-semibold text-emerald-100 transition hover:text-white"
              href={`/register?next=${encodeURIComponent(nextPath)}`}
            >
              Create an account
            </Link>
            <span className="text-white/26">·</span>
            <Link
              className="font-semibold text-emerald-100 transition hover:text-white"
              href="/pricing"
            >
              View plans
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
