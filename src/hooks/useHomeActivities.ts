import { useQuery } from "@tanstack/react-query";
import { fetchActivities, createActivitiesQueryKey } from "../api";
import { ActivitiesQueryParams } from "../types";

export const useHomeActivities = () => {
  const queryParams: ActivitiesQueryParams = {
    sport: undefined,
    distance: [0, 100],
    fetchMap: true,
    limit: 5,
    race: false,
    page: 1,
    order: "desc",
    orderBy: "",
  };

  return useQuery({
    queryKey: createActivitiesQueryKey(queryParams),
    queryFn: fetchActivities,
  });
};
