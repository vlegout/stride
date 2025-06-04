import axios from "axios";

import type { Activity, ActivitiesResponse, Profile } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN = import.meta.env.VITE_API_TOKEN || "";

export async function apiCall(url: string) {
  url = `${API_URL}${url}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  return response.data;
}

export async function fetchActivities({
  queryKey,
}: {
  queryKey: [string, number[], boolean, number, boolean, number, string, string];
}): Promise<ActivitiesResponse> {
  const [sport, distance, fetchMap, limit, race, page, order, orderBy] = queryKey;
  const params = [];
  if (fetchMap) params.push("map=true");
  if (race) params.push("race=true");
  if (sport !== "") params.push(`sport=${sport}`);
  if (page) params.push(`page=${page}`);
  if (limit) params.push(`limit=${limit}`);
  if (distance && distance.length === 2) {
    const [min, max] = distance;
    if (min !== undefined && min != 0) params.push(`min_distance=${min}`);
    if (max !== undefined && max != 100) params.push(`max_distance=${max}`);
  }
  if (order) params.push(`order=${order}`);
  if (orderBy) params.push(`order_by=${orderBy}`);
  const queryString = params.length ? "?" + params.join("&") : "";

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
