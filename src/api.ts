import { activitiesApi, authApi, usersApi, profileApi, fitnessApi, createActivitiesQueryKey } from "./api/index";
import type {
  Activity,
  ActivitiesResponse,
  ActivitiesQueryParams,
  FitnessResponse,
  Profile,
  User,
  UserCreate,
  GoogleAuthResponse,
  WeeksResponse,
} from "./types";

export { createActivitiesQueryKey };

export async function fetchActivities({
  queryKey,
}: {
  queryKey: [string, ActivitiesQueryParams];
}): Promise<ActivitiesResponse> {
  const [, params] = queryKey;
  return await activitiesApi.getAll(params);
}

export async function fetchLastActivities(): Promise<Activity[]> {
  return await activitiesApi.getLast();
}

export async function fetchActivity(id: string): Promise<Activity> {
  return await activitiesApi.getById(id);
}

export async function fetchProfile(): Promise<Profile> {
  return await profileApi.get();
}

export async function fetchWeeks(): Promise<WeeksResponse> {
  return await fitnessApi.getWeeks();
}

export async function fetchFitness(): Promise<FitnessResponse> {
  return await fitnessApi.get();
}

export async function uploadActivity(fitFile: File, title: string, race: boolean): Promise<Activity> {
  return await activitiesApi.upload(fitFile, title, race);
}

export async function fetchCurrentUser(): Promise<User> {
  return await usersApi.getCurrentUser();
}

export async function authenticateWithGoogle(userData: UserCreate): Promise<GoogleAuthResponse> {
  return await authApi.googleAuth(userData);
}
