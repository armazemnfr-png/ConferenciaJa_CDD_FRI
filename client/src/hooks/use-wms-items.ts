import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { UpdateWmsItemRequest, InsertWmsItem } from "@shared/schema";

export function useWmsItems(mapNumber: string) {
  return useQuery({
    queryKey: [api.wmsItems.listByMap.path, mapNumber],
    queryFn: async () => {
      if (!mapNumber) return [];
      const url = buildUrl(api.wmsItems.listByMap.path, { mapNumber });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch WMS items");
      return api.wmsItems.listByMap.responses[200].parse(await res.json());
    },
    enabled: !!mapNumber,
  });
}

export function useUpdateWmsItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateWmsItemRequest) => {
      const validated = api.wmsItems.update.input.parse(updates);
      const url = buildUrl(api.wmsItems.update.path, { id });
      const res = await fetch(url, {
        method: api.wmsItems.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Item not found");
        throw new Error("Failed to update item");
      }
      return api.wmsItems.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate the list for the map this item belongs to
      queryClient.invalidateQueries({ queryKey: [api.wmsItems.listByMap.path, data.mapNumber] });
    },
  });
}

export function useUploadWmsItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: InsertWmsItem[]) => {
      const validated = api.wmsItems.upload.input.parse({ items });
      const res = await fetch(api.wmsItems.upload.path, {
        method: api.wmsItems.upload.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) throw new Error("Validation failed for uploaded items");
        throw new Error("Failed to upload items");
      }
      return api.wmsItems.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.wmsItems.listByMap.path] });
    },
  });
}
