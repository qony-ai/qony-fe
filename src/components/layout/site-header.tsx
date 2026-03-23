"use client";

import { useEffect, useState } from "react";

import type { AuthSession } from "@/src/lib/auth/types";

import { SiteHeaderClient } from "./site-header-client";

export function SiteHeader({
  compact = false,
  initialSession = null,
}: {
  compact?: boolean;
  initialSession?: AuthSession | null;
}) {
  const [session, setSession] = useState<AuthSession | null>(initialSession);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isActive) {
            setSession(null);
          }
          return;
        }

        const payload = (await response.json()) as {
          data?: AuthSession | null;
        };

        if (isActive) {
          setSession(payload.data ?? null);
        }
      } catch {
        if (isActive) {
          setSession(null);
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  return <SiteHeaderClient compact={compact} session={session} />;
}
