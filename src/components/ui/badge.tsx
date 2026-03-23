import type { HTMLAttributes } from "react";

import { cn } from "@/src/lib/utils";

type BadgeTone = "default" | "success" | "warning" | "subtle";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-emerald-300/24 bg-emerald-300/12 text-emerald-50",
  success: "border-teal-300/24 bg-teal-300/12 text-teal-50",
  warning: "border-lime-300/20 bg-lime-300/10 text-lime-50",
  subtle: "border-emerald-200/12 bg-emerald-300/8 text-white/72",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  className,
  tone = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
