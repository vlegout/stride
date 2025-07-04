import { apiClient } from "../client";
import type { Activity, ActivitiesResponse, ActivitiesQueryParams } from "../../types";

export const activitiesApi = {
  getAll: async (params: ActivitiesQueryParams): Promise<ActivitiesResponse> => {
    const { sport, distance, fetchMap, limit, race, page, order, orderBy } = params;

    const urlParams = new URLSearchParams();

    if (fetchMap) urlParams.append("map", "true");
    if (race) urlParams.append("race", "true");
    if (sport) urlParams.append("sport", sport);
    if (page) urlParams.append("page", page.toString());
    if (limit) urlParams.append("limit", limit.toString());
    if (distance && distance.length === 2) {
      const [min, max] = distance;
      if (min !== undefined && min !== 0) urlParams.append("min_distance", min.toString());
      if (max !== undefined && max !== 100) urlParams.append("max_distance", max.toString());
    }
    if (order) urlParams.append("order", order);
    if (orderBy) urlParams.append("order_by", orderBy);

    const queryString = urlParams.toString();
    const url = `/activities/${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<ActivitiesResponse>(url);
    return response.data;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await apiClient.get<Activity>(`/activities/${id}/`);
    return response.data;
  },

  getLast: async (): Promise<Activity[]> => {
    const response = await apiClient.get<ActivitiesResponse>("/activities/");
    return response.data.activities;
  },

  upload: async (fitFile: File, title: string, race: boolean): Promise<Activity> => {
    const formData = new FormData();
    formData.append("fit_file", fitFile);
    formData.append("title", title);
    formData.append("race", race.toString());

    const response = await apiClient.post<Activity>("/activities/", formData);
    return response.data;
  },
};
