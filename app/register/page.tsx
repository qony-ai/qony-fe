import Link from "next/link";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { RegisterForm } from "@/src/features/auth/register-form";
import { normalizeNextPath } from "@/src/lib/auth/navigation";
import { getConfiguredOAuthProviders } from "@/src/lib/auth/server";
import { redirectIfAuthenticated } from "@/src/lib/auth/session";

export default async function RegisterPage({
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
      description="Create a Qony account to unlock protected workspace routes, billing-aware upgrades, and a session that maps cleanly into the backend actor contract."
      eyebrow="Authentication"
      title="Create your Qony account"
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Start with Google OAuth or create an email/password account. New sessions land on the Free plan and can upgrade later without leaving the product flow."
            eyebrow="Create account"
            title="Start with a secure product identity"
          />
          <div className="mt-6">
            <RegisterForm nextPath={nextPath} providers={oauthProviders} />
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Account creation drops you directly into the protected app shell so the rest of the product behaves like one coherent workspace."
            eyebrow="After account creation"
            title="Protected product flow"
          />
          <div className="mt-6 grid gap-3">
            {[
              "Project dashboard and workspace routes",
              "Pricing and billing entry points tied to your plan",
              "Project ingest, detail, and fullscreen canvas",
              "Export preview and graph output under one session",
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
          <p className="mt-5 text-sm text-white/60">
            Already have an account?{" "}
            <Link className="font-semibold text-emerald-100 transition hover:text-white" href={`/login?next=${encodeURIComponent(nextPath)}`}>
              Sign in here
            </Link>
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
