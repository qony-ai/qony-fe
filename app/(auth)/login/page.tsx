import { AppShell } from "@/src/components/layout/app-shell";
import { Panel } from "@/src/components/ui/panel";
import { LoginForm } from "@/src/features/auth/login-form";
import { getConfiguredOAuthProviders } from "@/src/lib/auth/server";
import { redirectIfAuthenticated } from "@/src/lib/auth/session";

function resolveNextPath(rawNext: string | undefined) {
  if (!rawNext || !rawNext.startsWith("/")) {
    return "/dashboard";
  }

  return rawNext;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = resolveNextPath(next);
  await redirectIfAuthenticated(nextPath);

  return (
    <AppShell
      description="Sign in to continue from project dashboard to typed graph editor and export."
      eyebrow="Auth"
      title="Sign in"
    >
      <div className="mx-auto grid w-full max-w-xl gap-6">
        <Panel className="rounded-[30px] p-6 md:p-8">
          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/40">
              Login
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
              Continue to your active cases
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Sign in to upload business-case documents, edit the typed graph, and export the result.
            </p>
          </div>

          <LoginForm
            nextPath={nextPath}
            providers={getConfiguredOAuthProviders()}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
