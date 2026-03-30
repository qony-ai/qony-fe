import type { ReactNode } from "react";

import { SiteFooter } from "@/src/components/layout/site-footer";
import { SiteHeader } from "@/src/components/layout/site-header";
import type { AuthSession } from "@/src/lib/auth/types";
import { cn } from "@/src/lib/utils";

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  hideHeroOnPrint = false,
  initialSession = null,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  hideHeroOnPrint?: boolean;
  initialSession?: AuthSession | null;
}) {
  return (
    <div className="page-shell min-h-screen">
      <SiteHeader compact initialSession={initialSession ?? null} />
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-28 md:px-6">
        <header
          className={cn(
            "glass-panel hero-glow rounded-[30px] border border-emerald-200/14 p-5 md:p-8",
            hideHeroOnPrint ? "print-hidden" : "",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-emerald-200/65">
                {eyebrow}
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62 md:text-base">
                  {description}
                </p>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </header>
        <div className="mt-6 flex-1">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
