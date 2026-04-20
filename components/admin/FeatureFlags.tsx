export function FeatureFlags({
  flags,
}: {
  flags: Array<{ key: string; enabled: boolean; description: string }>;
}) {
  return (
    <div className="grid gap-3">
      {flags.map((flag) => (
        <div className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 p-4" key={flag.key}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{flag.key}</h3>
            <span className="text-xs uppercase tracking-[0.18em] text-white/48">
              {flag.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/64">{flag.description}</p>
        </div>
      ))}
    </div>
  );
}
