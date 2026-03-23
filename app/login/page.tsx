import { redirectIfAuthenticated } from "@/src/lib/auth/session";
import { LoginForm } from "@/src/features/auth/login-form";
import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Panel, PanelHeader } from "@/src/components/ui/panel";

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = normalizeNextPath(next);
  await redirectIfAuthenticated(nextPath);

  return (
    <AppShell
      description="Sign in to access the Qony workspace, project dashboard, and structured canvas."
      eyebrow="Authentication"
      title="Login to Qony AI"
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Auth saat ini ditangani di Next supaya route bisa diproteksi dan identity user bisa diteruskan ke backend Python."
            eyebrow="Secure access"
            title="Access the workspace"
          />
          <div className="mt-6">
            <LoginForm nextPath={nextPath} />
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="The product flow is locked behind login so dashboard, project detail, export, and canvas all stay in one authenticated workspace."
            eyebrow="What you get"
            title="After login"
          />
          <div className="mt-6 grid gap-3">
            {[
              "Dashboard for all projects",
              "Project detail for one case",
              "Fullscreen graph canvas",
              "Narrative and graph PDF export",
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
            Belum punya akun?{" "}
            <a
              className="font-semibold text-emerald-100 transition hover:text-white"
              href={`/register?next=${encodeURIComponent(nextPath)}`}
            >
              Register di sini
            </a>
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
