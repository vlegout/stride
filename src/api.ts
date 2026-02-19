import axios from "axios";
import { type } from "arktype";

import type {
  Activity,
  ActivitiesResponse,
  ActivitiesQueryParams,
  ActivityUpdate,
  BestPerformanceResponse,
  FitnessResponse,
  HeatmapResponse,
  PowerProfileResponse,
  Profile,
  User,
  UserCreate,
  UserUpdate,
  GoogleAuthResponse,
  WeeksResponse,
} from "./types";
import {
  Activity as ActivityValidator,
  ActivitiesResponse as ActivitiesResponseValidator,
  ActivityZonesRawResponse as ActivityZonesRawResponseValidator,
  BestPerformanceResponse as BestPerformanceResponseValidator,
  FitnessResponse as FitnessResponseValidator,
  HeatmapResponse as HeatmapResponseValidator,
  PowerProfileResponse as PowerProfileResponseValidator,
  Profile as ProfileValidator,
  User as UserValidator,
  GoogleAuthResponse as GoogleAuthResponseValidator,
  WeeksResponse as WeeksResponseValidator,
} from "./types";
import { useAuthStore } from "./store";
import { isTokenValid } from "./utils";

const API_URL = import.meta.env.VITE_API_URL || "";

function getAuthToken(): string | null {
  const authStore = useAuthStore.getState();

  // Check if we have a valid JWT token
  if (isTokenValid(authStore.token, authStore.tokenExpiry)) {
    return authStore.token;
  }

  // No valid token available
  return null;
}

function validateResponse<T>(data: unknown, validator: (data: unknown) => T | type.errors, context: string): T {
  const result = validator(data);
  if (result instanceof type.errors) {
    console.error(`API response validation failed for ${context}:`, result.summary);
    throw new Error(`Invalid API response: ${result.summary}`);
  }
  return result;
}

export async function apiCall<T = unknown>(url: string): Promise<T> {
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
  if (sport) urlParams.push(`sport=${sport}`);
  if (page) urlParams.push(`page=${page}`);
  if (limit) urlParams.push(`limit=${limit}`);
  if (distance && distance.length === 2) {
    const [min, max] = distance;
    if (min !== undefined && min !== 0) urlParams.push(`min_distance=${min}`);
    if (max !== undefined && max !== 100) urlParams.push(`max_distance=${max}`);
  }
  if (order) urlParams.push(`order=${order}`);
  if (orderBy) urlParams.push(`order_by=${orderBy}`);
  const queryString = urlParams.length ? `?${urlParams.join("&")}` : "";

  const data = await apiCall(`/activities/${queryString}`);
  return validateResponse(data, ActivitiesResponseValidator, "fetchActivities");
}

export async function fetchLastActivities(): Promise<Activity[]> {
  const data = await apiCall("/activities/");
  const ActivityArray = ActivityValidator.array();
  return validateResponse(data, ActivityArray, "fetchLastActivities");
}

export async function fetchActivity(id: string): Promise<Activity> {
  const data = await apiCall(`/activities/${id}/`);
  return validateResponse(data, ActivityValidator, "fetchActivity");
}

export async function fetchActivityZones(id: string): Promise<{
  heartRate?: { zone: number; time: number; percentage: number }[];
  power?: { zone: number; time: number; percentage: number }[];
  pace?: { zone: number; time: number; percentage: number }[];
}> {
  const data = await apiCall(`/activities/${id}/zones/`);
  const response = validateResponse(data, ActivityZonesRawResponseValidator, "fetchActivityZones");

  // Transform API response to match frontend expectations
  const transformed: {
    heartRate?: { zone: number; time: number; percentage: number }[];
    power?: { zone: number; time: number; percentage: number }[];
    pace?: { zone: number; time: number; percentage: number }[];
  } = {};

  // Calculate total time for percentage calculation
  const calculateTotalTime = (zones: { time_in_zone: number }[]) => zones.reduce((sum, z) => sum + z.time_in_zone, 0);

  if (response.heart_rate && response.heart_rate.length > 0) {
    const totalTime = calculateTotalTime(response.heart_rate);
    transformed.heartRate = response.heart_rate.map((z) => ({
      zone: z.zone.index,
      time: z.time_in_zone,
      percentage: totalTime > 0 ? (z.time_in_zone / totalTime) * 100 : 0,
    }));
  }

  if (response.power && response.power.length > 0) {
    const totalTime = calculateTotalTime(response.power);
    transformed.power = response.power.map((z) => ({
      zone: z.zone.index,
      time: z.time_in_zone,
      percentage: totalTime > 0 ? (z.time_in_zone / totalTime) * 100 : 0,
    }));
  }

  if (response.pace && response.pace.length > 0) {
    const totalTime = calculateTotalTime(response.pace);
    transformed.pace = response.pace.map((z) => ({
      zone: z.zone.index,
      time: z.time_in_zone,
      percentage: totalTime > 0 ? (z.time_in_zone / totalTime) * 100 : 0,
    }));
  }

  return transformed;
}

export async function fetchProfile(): Promise<Profile> {
  const data = await apiCall("/profile/");
  return validateResponse(data, ProfileValidator, "fetchProfile");
}

export async function fetchWeeks(offset = 0, limit = 5): Promise<WeeksResponse> {
  const params = new URLSearchParams();
  params.append("offset", offset.toString());
  params.append("limit", limit.toString());
  const data = await apiCall(`/weeks/?${params.toString()}`);
  return validateResponse(data, WeeksResponseValidator, "fetchWeeks");
}

export async function fetchFitness(): Promise<FitnessResponse> {
  const data = await apiCall("/fitness/");
  return validateResponse(data, FitnessResponseValidator, "fetchFitness");
}

export async function fetchBestPerformances(
  sport: string,
  distance?: string,
  time?: string,
  year?: number,
): Promise<BestPerformanceResponse> {
  const params = new URLSearchParams({ sport });
  if (distance) params.append("distance", distance);
  if (time) params.append("time", time);
  if (year) params.append("year", year.toString());

  const data = await apiCall(`/best/?${params.toString()}`);
  return validateResponse(data, BestPerformanceResponseValidator, "fetchBestPerformances");
}

export async function fetchPowerProfile(): Promise<PowerProfileResponse> {
  const data = await apiCall("/best/power-profile/");
  return validateResponse(data, PowerProfileResponseValidator, "fetchPowerProfile");
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

  return validateResponse(response.data, ActivityValidator, "uploadActivity");
}

export async function updateActivity(id: string, updates: ActivityUpdate): Promise<Activity> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No valid authentication token available");
  }

  const response = await axios.patch(`${API_URL}/activities/${id}/`, updates, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return validateResponse(response.data, ActivityValidator, "updateActivity");
}

export async function deleteActivity(id: string): Promise<void> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No valid authentication token available");
  }

  await axios.delete(`${API_URL}/activities/${id}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchCurrentUser(): Promise<User> {
  const data = await apiCall("/users/me/");
  return validateResponse(data, UserValidator, "fetchCurrentUser");
}

export async function updateUser(updates: UserUpdate): Promise<User> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No valid authentication token available");
  }

  const response = await axios.patch(`${API_URL}/users/me/`, updates, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return validateResponse(response.data, UserValidator, "updateUser");
}

export async function authenticateWithGoogle(userData: UserCreate): Promise<GoogleAuthResponse> {
  const response = await axios.post(`${API_URL}/auth/google/`, userData, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return validateResponse(response.data, GoogleAuthResponseValidator, "authenticateWithGoogle");
}

export async function fetchHeatmap(): Promise<HeatmapResponse> {
  const data = await apiCall("/heatmap/");
  return validateResponse(data, HeatmapResponseValidator, "fetchHeatmap");
}
