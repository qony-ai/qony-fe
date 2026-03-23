import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/src/lib/utils";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: ReactNode;
}

export function Panel({ className, accent, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-[28px] border border-emerald-200/12 p-5 md:p-6",
        className,
      )}
      {...props}
    >
      {accent !== null ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(134,255,138,0.9),rgba(46,230,191,0.7),transparent)]" />
      ) : null}
      {children}
    </div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-200/65">
            {eyebrow}
          </p>
        ) : null}
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}
