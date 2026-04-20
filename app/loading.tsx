import { AppShell } from "@/src/components/layout/app-shell";
import { Panel } from "@/src/components/ui/panel";

export default function LoadingPage() {
  return (
    <AppShell
      description="Qony is fetching the latest route data and rebuilding the typed graph interface."
      eyebrow="Loading"
      title="Preparing the interface"
    >
      <Panel className="rounded-[30px] p-6">
        <div className="flex items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-200" />
          <p className="text-sm text-white/62">Fetching the latest graph data.</p>
        </div>
      </Panel>
    </AppShell>
  );
}
