export function ProgressOverlay({
  step,
  pct,
}: {
  step: string;
  pct: number;
}) {
  return (
    <div className="rounded-[28px] border border-emerald-200/10 bg-[#0b3128]/94 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Ingestion Progress</p>
      <div className="mt-4 h-3 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm text-white/64">
        {step} · {pct}%
      </p>
    </div>
  );
}
