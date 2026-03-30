import Link from "next/link";

import { AppShell } from "@/src/components/layout/app-shell";
import { requireAuthSession } from "@/src/lib/auth/session";
import { Button } from "@/src/components/ui/button";
import { Panel, PanelHeader } from "@/src/components/ui/panel";

export default async function ProfilePage() {
  const session = await requireAuthSession("/profile");

  return (
    <AppShell
      actions={
        <>
          <Link href="/billing">
            <Button variant="secondary">Open billing</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Open dashboard</Button>
          </Link>
        </>
      }
      description="Profile and session identity used by the Better Auth frontend layer and the signed backend actor contract."
      eyebrow="Profile"
      title={session.name}
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="This identity is used to protect routes in Next and to identify the actor in the Python backend."
            eyebrow="Session"
            title="Current account"
          />
          <div className="mt-6 grid gap-4">
            <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-50/42">
                Username
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{session.username}</p>
            </div>
            <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-50/42">
                Name
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{session.name}</p>
            </div>
            <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-50/42">
                Email
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{session.email}</p>
            </div>
            <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-50/42">
                Plan
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {session.plan}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Use the top-right menu to move between profile, billing, dashboard, and logout."
            eyebrow="Navigation"
            title="Session-aware header"
          />
          <div className="mt-6 grid gap-3">
            {[
              "Home, Dashboard, and About stay in the top navigation.",
              "The right side now exposes Pricing, Billing, Profile, and Logout depending on session state.",
              "Protected routes redirect to the login page when the session is missing.",
            ].map((item) => (
              <div
                className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4 text-sm leading-6 text-white/68"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
