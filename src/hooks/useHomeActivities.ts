import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchActivities } from "../api";
import { ActivitiesQueryParams } from "../types";

const ACTIVITIES_PER_PAGE = 5;

export const useHomeActivities = () => {
  return useInfiniteQuery({
    queryKey: ["homeActivities"],
    queryFn: ({ pageParam = 1 }) => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
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
