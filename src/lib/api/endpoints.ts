export const apiEndpoints = {
  projects: "/api/qony/projects",
  project: (projectId: string) => `/api/qony/projects/${projectId}`,
  ingest: "/api/qony/ingest",
  workspace: (projectId: string) => `/api/qony/workspace/${projectId}`,
  mutateWorkspace: "/api/qony/workspace/mutate",
  chatWorkspace: "/api/qony/workspace/chat",
  exportPreview: (projectId: string) => `/api/qony/export/preview/${projectId}`,
  health: "/health",
  ready: "/ready",
};
