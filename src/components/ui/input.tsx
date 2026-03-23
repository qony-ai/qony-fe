import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/src/lib/utils";

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(95,170,143,0.14),rgba(17,63,49,0.28))] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-emerald-300/44 focus:bg-[linear-gradient(180deg,rgba(108,184,156,0.18),rgba(20,71,54,0.3))] focus:ring-2 focus:ring-emerald-300/20",
        className,
      )}
      {...props}
    />
  );
}
