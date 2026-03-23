"use client";

import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { Panel } from "@/src/components/ui/panel";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <AppShell
      description="The current route hit an unexpected error. Retry the action or return to the dashboard."
      eyebrow="Application error"
      title="Something went wrong"
    >
      <Panel className="rounded-[30px] p-6">
        <div className="rounded-[24px] border border-emerald-200/12 bg-emerald-300/8 px-5 py-4 text-sm text-white/78">
          {error.message || "Unexpected application error."}
        </div>
        <div className="mt-5">
          <Button onClick={reset} variant="secondary">
            Retry
          </Button>
        </div>
      </Panel>
    </AppShell>
  );
}
