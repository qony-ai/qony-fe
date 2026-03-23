import Link from "next/link";

import { cn } from "@/src/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("print-hidden border-t border-emerald-200/10 bg-[linear-gradient(180deg,rgba(8,26,18,0),rgba(10,36,24,0.5))]", className)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-white/52 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="text-base font-semibold text-white">Qony AI</p>
          <p className="mt-2 max-w-xl text-white/48">
            A structured AI workspace for serious problem-solving, evidence-led
            analysis, and export-ready synthesis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link className="transition hover:text-white" href="/">
            Home
          </Link>
          <Link className="transition hover:text-white" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition hover:text-white" href="/about">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
