export function UsageStats({
  items,
}: {
  items: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4" key={item.label}>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
