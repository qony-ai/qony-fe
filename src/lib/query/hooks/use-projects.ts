"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { browserApi } from "@/src/lib/api/client";
import { queryKeys } from "@/src/lib/query/keys";
import type {
  ProjectCreateRequest,
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateRequest,
} from "@/src/lib/types/api";

type ProjectsQueryOptions = Omit<
  UseQueryOptions<ProjectSummary[]>,
  "queryKey" | "queryFn"
> & {
  initialData?: ProjectSummary[];
};

export function useProjectsQuery(options: ProjectsQueryOptions = {}) {
  return useQuery<ProjectSummary[]>({
    queryKey: queryKeys.projects.all(),
    queryFn: async () => {
      const payload = await browserApi.listProjects();
      return payload.items;
    },
    ...options,
  });
}

export function useProjectQuery(projectId: string | null) {
  return useQuery<ProjectDetail>({
    queryKey: queryKeys.projects.detail(projectId ?? ""),
    queryFn: () => {
      if (!projectId) {
        throw new Error("projectId is required");
      }
      return browserApi.getProject(projectId);
    },
    enabled: Boolean(projectId),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<ProjectDetail, Error, ProjectCreateRequest>({
    mutationFn: (payload) => browserApi.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ProjectDetail,
    Error,
    { projectId: string; payload: ProjectUpdateRequest }
  >({
    mutationFn: ({ projectId, payload }) =>
      browserApi.updateProject(projectId, payload),
    onSuccess: (_project, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: (projectId) => browserApi.deleteProject(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.setQueryData<ProjectSummary[] | undefined>(
        queryKeys.projects.all(),
        (current) =>
          current?.filter((project) => project.id !== projectId) ?? current,
      );
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
}
