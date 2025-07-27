import { useQuery } from "@tanstack/react-query";
import { fetchActivityPerformanceRecords } from "../api";

export function useActivityPerformanceRecords(activityId: string) {
  return useQuery({
    queryKey: ["activity-performance-records", activityId],
    queryFn: () => fetchActivityPerformanceRecords(activityId),
    enabled: !!activityId,
  });
}
