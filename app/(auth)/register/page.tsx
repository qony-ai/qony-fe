import { AppShell } from "@/src/components/layout/app-shell";
import { Panel } from "@/src/components/ui/panel";
import { RegisterForm } from "@/src/features/auth/register-form";
import { getConfiguredOAuthProviders } from "@/src/lib/auth/server";
import { redirectIfAuthenticated } from "@/src/lib/auth/session";

function resolveNextPath(rawNext: string | undefined) {
  if (!rawNext || !rawNext.startsWith("/")) {
    return "/dashboard";
  }

  return rawNext;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = resolveNextPath(next);
  await redirectIfAuthenticated(nextPath);

  return (
    <AppShell
      description="Create an account to start ingesting business cases and building typed graph analysis."
      eyebrow="Auth"
      title="Create account"
    >
      <div className="mx-auto grid w-full max-w-xl gap-6">
        <Panel className="rounded-[30px] p-6 md:p-8">
          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
              Register
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
              Start a new analysis workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              New accounts can create projects, upload source files, and iterate on typed graph structure right away.
            </p>
          </div>

          <RegisterForm
            nextPath={nextPath}
            providers={getConfiguredOAuthProviders()}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
