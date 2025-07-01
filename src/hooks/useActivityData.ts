import { useQuery } from "@tanstack/react-query";
import { fetchActivity } from "../api";

export const useActivityData = (activityId: string) => {
  return useQuery({
    queryKey: ["activityId", activityId],
    queryFn: async () => fetchActivity(activityId),
  });
};
