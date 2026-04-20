"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { makeQueryClient } from "@/src/lib/query/client";

let browserQueryClient: QueryClient | undefined;

/**
 * React-Query client accessor for the browser.
 *
 * In App Router we render server and client components in the same tree,
 * but the QueryClient must survive RSC suspense boundaries *only within a
 * single browser session*. Creating it in a module-level variable makes
 * it a singleton on the client while still letting each SSR pass own its
 * own instance (see :func:`QueryProvider`).
 */
function getBrowserQueryClient() {
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // `useState` gives us a stable client per render tree. On the server
  // that means one client per request; in the browser we route through
  // the module singleton so tab-lifetime cache survives route changes.
  const [client] = useState(() =>
    typeof window === "undefined" ? makeQueryClient() : getBrowserQueryClient(),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
