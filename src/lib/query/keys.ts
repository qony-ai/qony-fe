/**
 * Centralised query-key registry.
 *
 * Every key is a function returning a `readonly` tuple so React Query's
 * partial-match invalidation works predictably. Call sites should never
 * hand-roll their own keys — add a new factory here so invalidation
 * targets stay aligned across hooks.
 */

export const queryKeys = {
  projects: {
    all: () => ["projects"] as const,
    detail: (projectId: string) => ["projects", projectId] as const,
  },
  workspace: {
    all: () => ["workspace"] as const,
    byProject: (projectId: string) => ["workspace", projectId] as const,
  },
  exportPreview: {
    byProject: (projectId: string) => ["export-preview", projectId] as const,
  },
  admin: {
    featureFlags: () => ["admin", "feature-flags"] as const,
    usageMe: () => ["admin", "usage", "me"] as const,
    health: () => ["admin", "health"] as const,
  },
} as const;
