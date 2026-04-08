import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Conference, InsertConference } from "@shared/schema";

// Tipo para os filtros
interface FilterParams {
  startDate?: string;
  endDate?: string;
  driverId?: string;
  mapNumber?: string;
}

export function useConferences(filters?: FilterParams) {
  return useQuery({
    // A queryKey agora inclui os filtros. Se o filtro mudar, o React Query recarrega.
    queryKey: [api.conferences.list.path, filters],
    queryFn: async () => {
      // Construímos a URL com os parâmetros de busca (query strings)
      const url = new URL(window.location.origin + api.conferences.list.path);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });
      }

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conferences");
      return api.conferences.list.responses[200].parse(await res.json());
    },
  });
}

export function useDashboardMetrics(filters?: FilterParams) {
  return useQuery({
    queryKey: [api.conferences.dashboard.path, filters],
    queryFn: async () => {
      const url = new URL(window.location.origin + api.conferences.dashboard.path);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });
      }

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      return api.conferences.dashboard.responses[200].parse(await res.json());
    },
  });
}

export function useMetricsByRoom() {
  return useQuery<{ room: string; avgMinutes: number; count: number }[]>({
    queryKey: ["/api/dashboard/by-room"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/by-room", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar métricas por sala");
      return res.json();
    },
  });
}

export function useConference(mapNumber: string) {
  return useQuery({
    queryKey: [api.conferences.get.path, mapNumber],
    queryFn: async () => {
      if (!mapNumber) return null;
      const url = buildUrl(api.conferences.get.path, { mapNumber });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch conference");
      return api.conferences.get.responses[200].parse(await res.json());
    },
    enabled: !!mapNumber,
  });
}

export function useStartConference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { driverId: string; mapNumber: string }) => {
      const validated = api.conferences.start.input.parse(data);
      const res = await fetch(api.conferences.start.path, {
        method: api.conferences.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.conferences.start.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to start conference");
      }
      return api.conferences.start.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.conferences.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.conferences.get.path, variables.mapNumber] });
      queryClient.invalidateQueries({ queryKey: [api.conferences.dashboard.path] });
    },
  });
}

export function useFinishConference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.conferences.finish.path, { id });
      const res = await fetch(url, {
        method: api.conferences.finish.method,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Conference not found");
        throw new Error("Failed to finish conference");
      }
      return api.conferences.finish.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conferences.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.conferences.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.conferences.dashboard.path] });
    },
  });
}