import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a QueryClient with defaults tuned for Qony.
 *
 * - `staleTime: 30_000` prevents the dashboard from re-hitting the API on
 *   every tab focus while still picking up changes within the same session.
 * - `gcTime: 5 * 60_000` keeps evicted caches around long enough for
 *   route transitions to reuse them.
 * - `retry: 1` because the underlying gateway (live → mock fallback in
 *   auto mode) already handles transient errors; we don't want to hide
 *   bad payloads behind long retry chains.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
