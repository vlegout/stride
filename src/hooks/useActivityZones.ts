import { useQuery } from "@tanstack/react-query";
import { fetchActivityZones } from "../api";

export const useActivityZones = (activityId: string) => {
  return useQuery({
    queryKey: ["activityZones", activityId],
    queryFn: async () => fetchActivityZones(activityId),
  });
};
