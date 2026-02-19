import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchActivities } from "../api";
import type { ActivitiesQueryParams, Sport } from "../types";
import { useAuthStore } from "../store";

const ACTIVITIES_PER_PAGE = 5;

function getEnabledSports(
  user: { running_enabled: boolean; cycling_enabled: boolean; swimming_enabled: boolean } | null,
): string | undefined {
  if (!user) return undefined;

  const sports: Sport[] = [];
  if (user.running_enabled) sports.push("running");
  if (user.cycling_enabled) sports.push("cycling");
  if (user.swimming_enabled) sports.push("swimming");

  if (sports.length === 0 || sports.length === 3) return undefined;
  return sports.join(",");
}

export const useHomeActivities = () => {
  const { user } = useAuthStore();
  const sport = getEnabledSports(user);

  return useInfiniteQuery({
    queryKey: ["homeActivities", sport],
    queryFn: ({ pageParam = 1 }) => {
      const params: ActivitiesQueryParams = {
        sport,
        distance: [0, 100],
        fetchMap: true,
        limit: ACTIVITIES_PER_PAGE,
        race: false,
        page: pageParam,
        order: "desc",
        orderBy: "",
      };
      return fetchActivities({ queryKey: ["activities", params] });
    },
    getNextPageParam: (lastPage) => {
      const { page, per_page, total } = lastPage.pagination;
      if (page * per_page < total) {
        return page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};
