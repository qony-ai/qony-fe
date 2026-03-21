export const apiEndpoints = {
  projects: "/api/v1/projects",
  project: (projectId: string) => `/api/v1/projects/${projectId}`,
  ingest: "/api/v1/ingest",
  workspace: (projectId: string) => `/api/v1/workspace/${projectId}`,
  mutateWorkspace: "/api/v1/workspace/mutate",
  chatWorkspace: "/api/v1/workspace/chat",
  exportPreview: (projectId: string) => `/api/v1/export/preview/${projectId}`,
  health: "/health",
  ready: "/ready",
};
