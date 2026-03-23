import Link from "next/link";

import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { Panel } from "@/src/components/ui/panel";

export default function NotFoundPage() {
  return (
    <AppShell
      description="The requested Qony resource could not be found. Open the dashboard, continue from ingest, or return to the landing page."
      eyebrow="Not found"
      title="This route does not exist"
    >
      <Panel className="rounded-[30px] p-6">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
          <Link href="/">
            <Button>Back to landing</Button>
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
