import axios from "axios";

import type { Activity, Profile } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN = import.meta.env.VITE_API_TOKEN || "";

export async function apiCall(url: string) {
  url = `${API_URL}${url}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  return response.data;
}

export async function fetchActivities({ queryKey }: { queryKey: [string, number[], boolean, number] }): Promise<Activity[]> {
  const [sport, distance, fetchMap, limit] = queryKey;
  const params = [];
  if (fetchMap) params.push("map=true");
  if (limit) params.push(`limit=${limit}`);
  const queryString = params.length ? "?" + params.join("&") : "";
  const data = await apiCall("/activities/" + queryString);

  if (sport === "all") {
    return data.filter(
      (activity: Activity) =>
        activity.total_distance >= distance[0] * 1000 &&
        (distance[1] === 100 || activity.total_distance <= distance[1] * 1000),
    );
  }

  return data.filter(
    (activity: Activity) =>
      activity.sport === sport &&
      activity.total_distance >= distance[0] * 1000 &&
      (distance[1] === 100 || activity.total_distance <= distance[1] * 1000),
  );
}

export async function fetchLastActivities(): Promise<Activity[]> {
  return await apiCall("/activities/");
}

export async function fetchActivity(id: string): Promise<Activity> {
  return await apiCall("/activities/" + id + "/");
}

export async function fetchProfile(): Promise<Profile> {
  return await apiCall("/profile");
}
