import Link from "next/link";

import { AppShell } from "@/src/components/layout/app-shell";
import { Badge } from "@/src/components/ui/badge";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { RegisterForm } from "@/src/features/auth/register-form";
import { redirectIfAuthenticated } from "@/src/lib/auth/session";

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = normalizeNextPath(next);
  await redirectIfAuthenticated(nextPath);

  return (
    <AppShell
      description="Create a local account for the Qony frontend so dashboard, ingest, project detail, export, and canvas stay protected."
      eyebrow="Authentication"
      title="Register to Qony AI"
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Untuk demo saat ini, auth disimpan lokal di Next dan dipakai untuk meneruskan actor identity ke backend Python."
            eyebrow="Create account"
            title="Start with username and password"
          />
          <div className="mt-6">
            <RegisterForm nextPath={nextPath} />
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Begitu akun dibuat, flow-nya langsung lanjut ke workspace app yang terlindungi."
            eyebrow="After register"
            title="Protected product flow"
          />
          <div className="mt-6 grid gap-3">
            {[
              "Dashboard semua project",
              "Create project lalu lanjut ingest",
              "Project detail dan fullscreen canvas",
              "Export preview dan graph PDF",
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
            Sudah punya akun?{" "}
            <Link className="font-semibold text-emerald-100 transition hover:text-white" href={`/login?next=${encodeURIComponent(nextPath)}`}>
              Login di sini
            </Link>
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
