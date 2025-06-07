import axios from "axios";

import type { Activity, ActivitiesResponse, ActivitiesQueryParams, Profile } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN = import.meta.env.VITE_API_TOKEN || "";

export async function apiCall(url: string) {
  url = `${API_URL}${url}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  return response.data;
}

export function createActivitiesQueryKey(params: ActivitiesQueryParams): [string, ActivitiesQueryParams] {
  return ["activities", params];
}

export async function fetchActivities({
  queryKey,
}: {
  queryKey: [string, ActivitiesQueryParams];
}): Promise<ActivitiesResponse> {
  const [, params] = queryKey;
  const { sport, distance, fetchMap, limit, race, page, order, orderBy } = params;

  const urlParams = [];
  if (fetchMap) urlParams.push("map=true");
  if (race) urlParams.push("race=true");
  if (sport !== "") urlParams.push(`sport=${sport}`);
  if (page) urlParams.push(`page=${page}`);
  if (limit) urlParams.push(`limit=${limit}`);
  if (distance && distance.length === 2) {
    const [min, max] = distance;
    if (min !== undefined && min != 0) urlParams.push(`min_distance=${min}`);
    if (max !== undefined && max != 100) urlParams.push(`max_distance=${max}`);
  }
  if (order) urlParams.push(`order=${order}`);
  if (orderBy) urlParams.push(`order_by=${orderBy}`);
  const queryString = urlParams.length ? "?" + urlParams.join("&") : "";

  return await apiCall("/activities/" + queryString);
}

export async function fetchLastActivities(): Promise<Activity[]> {
  return await apiCall("/activities/");
}

export async function fetchActivity(id: string): Promise<Activity> {
  return await apiCall("/activities/" + id + "/");
}

export async function fetchProfile(): Promise<Profile> {
  return await apiCall("/profile/");
}
