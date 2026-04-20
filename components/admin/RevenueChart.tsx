export function RevenueChart({
  exportCount,
  projectCount,
  userCount,
}: {
  exportCount: number;
  projectCount: number;
  userCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5 text-sm text-white/64">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Users</p>
        <p className="mt-3 text-2xl font-semibold text-white">{userCount}</p>
      </div>
      <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5 text-sm text-white/64">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Projects</p>
        <p className="mt-3 text-2xl font-semibold text-white">{projectCount}</p>
      </div>
      <div className="rounded-[28px] border border-emerald-200/10 bg-emerald-300/6 p-5 text-sm text-white/64">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Exports</p>
        <p className="mt-3 text-2xl font-semibold text-white">{exportCount}</p>
      </div>
    </div>
  );
}
