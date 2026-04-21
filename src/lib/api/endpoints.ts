export const apiEndpoints = {
  projects: "/api/qony/projects",
  project: (projectId: string) => `/api/qony/projects/${projectId}`,
  ingest: "/api/qony/ingest",
  workspace: (projectId: string) => `/api/qony/workspace/${projectId}`,
  mutateWorkspace: "/api/qony/workspace/mutate",
  chatWorkspace: "/api/qony/workspace/chat",
  exportPreview: (projectId: string, deliverableType?: string) =>
    `/api/qony/export/preview/${projectId}${
      deliverableType ? `?deliverable_type=${deliverableType}` : ""
    }`,
  exportJobs: "/api/qony/export/jobs",
  exportJob: (jobId: string) => `/api/qony/export/jobs/${jobId}`,
  health: "/health",
  ready: "/ready",
};
