"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  CreditCard,
  LogOut,
  Menu,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/lib/auth/client";
import { mapRawAuthSession, type RawAuthSession } from "@/src/lib/auth/shared";
import type { AuthSession } from "@/src/lib/auth/types";
import { cn } from "@/src/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/admin", label: "Admin" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/project") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/editor")
    );
  }

  if (href === "/pricing") {
    return pathname.startsWith("/pricing") || pathname.startsWith("/billing");
  }

  if (href === "/admin") {
    return pathname.startsWith("/admin");
  }

  return pathname === href;
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

function resolveSession(
  initialSession: AuthSession | null,
  liveSession: RawAuthSession | null | undefined,
  hasHydrated: boolean,
  isPending: boolean,
) {
  if (!hasHydrated || isPending || liveSession === undefined) {
    return initialSession;
  }

  return liveSession ? mapRawAuthSession(liveSession) : null;
}

export function SiteHeaderClient({
  compact = false,
  initialSession,
}: {
  compact?: boolean;
  initialSession?: AuthSession | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: liveSession, isPending: isSessionPending } =
    authClient.useSession();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const session = resolveSession(
    initialSession ?? null,
    liveSession as RawAuthSession | null | undefined,
    hasHydrated,
    isSessionPending,
  );
  const initials = session ? initialsFromName(session.name) : "";
  const isPro = session?.plan === "pro";
  const pricingHref = session ? "/pricing?checkout=pro" : "/pricing";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleLogout() {
    setAuthError(null);

    startTransition(async () => {
      try {
        const response = await authClient.signOut();
        if (response.error) {
          throw new Error(response.error.message || "Sign out failed.");
        }

        setMenuOpen(false);
        setMobileOpen(false);
        router.push("/login");
        router.refresh();
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "Sign out failed.",
        );
      }
    });
  }

  return (
    <nav
      className={cn(
        "print-hidden fixed left-0 right-0 top-0 z-50 border-b border-emerald-200/10 transition-all duration-300",
        compact
          ? "bg-[linear-gradient(180deg,rgba(8,34,22,0.94),rgba(6,26,18,0.9))] backdrop-blur-2xl"
          : "bg-[linear-gradient(180deg,rgba(6,38,24,0.9),rgba(6,32,22,0.55),transparent)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] font-semibold text-[#06261d] shadow-[0_16px_30px_rgba(87,255,164,0.28)]">
            Q
          </div>
          <div>
            <p className="text-lg font-semibold tracking-[-0.04em] text-white">
              Qony AI
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-50/42">
              Business case intelligence
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-emerald-300/14 text-white shadow-[inset_0_0_0_1px_rgba(110,255,182,0.12)]"
                    : "text-emerald-50/68 hover:bg-emerald-300/8 hover:text-white",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              {!isPro ? (
                <Link className="hidden md:block" href={pricingHref}>
                  <Button variant="secondary">
                    <Sparkles className="size-4" />
                    Upgrade
                  </Button>
                </Link>
              ) : (
                <div className="hidden rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-2 md:block">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-50/52">
                    Current plan
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Qony Pro
                  </p>
                </div>
              )}

              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-3 rounded-full border border-emerald-200/12 bg-emerald-300/8 px-3 py-2 text-left text-sm text-white transition hover:bg-emerald-300/12"
                  onClick={() => setMenuOpen((current) => !current)}
                  type="button"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-xs font-bold text-[#06261d]">
                    {initials}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold">{session.name}</span>
                    <span className="text-xs text-emerald-50/56">
                      @{session.username}
                    </span>
                  </span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-[24px] border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(8,30,20,0.96),rgba(7,24,18,0.96))] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
                    <div className="rounded-[18px] border border-emerald-200/10 bg-emerald-300/8 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {session.name}
                          </p>
                          <p className="mt-1 text-xs text-emerald-50/56">
                            {session.email}
                          </p>
                        </div>
                        <span className="rounded-full border border-emerald-200/12 bg-emerald-300/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-50/70">
                          {session.plan}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1">
                      <Link
                        className="rounded-2xl px-3 py-3 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/10 hover:text-white"
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        className="rounded-2xl px-3 py-3 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/10 hover:text-white"
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin
                      </Link>
                      <Link
                        className="rounded-2xl px-3 py-3 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/10 hover:text-white"
                        href="/billing"
                        onClick={() => setMenuOpen(false)}
                      >
                        Billing
                      </Link>
                      <Link
                        className="rounded-2xl px-3 py-3 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/10 hover:text-white"
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      {!isPro ? (
                        <Link
                          className="rounded-2xl px-3 py-3 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/10 hover:text-white"
                          href={pricingHref}
                          onClick={() => setMenuOpen(false)}
                        >
                          Upgrade to Pro
                        </Link>
                      ) : null}
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold text-white/78 transition hover:bg-emerald-300/10 hover:text-white"
                        disabled={isPending}
                        onClick={handleLogout}
                        type="button"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                    {authError ? (
                      <p className="mt-2 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-3 py-3 text-sm text-rose-100">
                        {authError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/register">
                <Button className="px-5" variant="secondary">
                  Create account
                </Button>
              </Link>
              <Link href="/login">
                <Button className="px-5" variant="primary">
                  Sign in
                </Button>
              </Link>
            </div>
          )}

          <button
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex size-11 items-center justify-center rounded-full border border-emerald-200/10 bg-emerald-300/[0.05] text-white md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            type="button"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-emerald-200/10 bg-[linear-gradient(180deg,rgba(8,30,20,0.97),rgba(7,24,18,0.97))] px-4 py-4 backdrop-blur-2xl md:hidden">
          <div className="grid gap-3">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-emerald-300/22 bg-emerald-300/10 text-white"
                      : "border-emerald-200/10 bg-emerald-300/[0.03] text-white/74 hover:bg-emerald-300/[0.06] hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}

            {session ? (
              <>
                <div className="rounded-2xl border border-emerald-200/10 bg-emerald-300/8 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {session.name}
                      </p>
                      <p className="mt-1 text-xs text-emerald-50/56">
                        {session.email}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-200/12 bg-emerald-300/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-50/70">
                      {session.plan}
                    </span>
                  </div>
                </div>
                <Link href="/billing" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" variant="secondary">
                    <CreditCard className="size-4" />
                    Billing
                  </Button>
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" variant="secondary">
                    <UserCircle2 className="size-4" />
                    Profile
                  </Button>
                </Link>
                {!isPro ? (
                  <Link href={pricingHref} onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">
                      <Sparkles className="size-4" />
                      Upgrade to Pro
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : null}
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(84,146,121,0.24),rgba(21,75,58,0.32))] px-5 py-2.5 text-sm font-semibold text-white"
                  disabled={isPending}
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
                {authError ? (
                  <p className="rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {authError}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" variant="secondary">
                    Create account
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" variant="primary">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
