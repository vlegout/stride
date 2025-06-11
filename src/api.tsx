import axios from "axios";

import type {
  Activity,
  ActivitiesResponse,
  ActivitiesQueryParams,
  Profile,
  User,
  UserCreate,
  GoogleAuthResponse,
} from "./types";
import { useAuthStore } from "./store";

const API_URL = import.meta.env.VITE_API_URL || "";

function getAuthToken(): string | null {
  const authStore = useAuthStore.getState();

  // Check if we have a valid JWT token
  if (authStore.isTokenValid() && authStore.token) {
    return authStore.token;
  }

  // No valid token available
  return null;
}

export async function apiCall(url: string) {
  url = `${API_URL}${url}`;
  const token = getAuthToken();

  if (!token) {
    throw new Error("No valid authentication token available");
  }

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
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

export async function uploadActivity(fitFile: File, title: string, race: boolean): Promise<Activity> {
  const formData = new FormData();
  formData.append("fit_file", fitFile);
  formData.append("title", title);
  formData.append("race", race.toString());

  const token = getAuthToken();

  if (!token) {
    throw new Error("No valid authentication token available");
  }

  const response = await axios.post(`${API_URL}/activities/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function fetchCurrentUser(): Promise<User> {
  return await apiCall("/users/me/");
}

export async function authenticateWithGoogle(userData: UserCreate): Promise<GoogleAuthResponse> {
  // No token needed for auth endpoint
  const response = await axios.post(`${API_URL}/auth/google/`, userData, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}
