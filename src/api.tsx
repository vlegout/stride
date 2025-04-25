import type { Activity } from "./types";

export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch(`/activities.json`);
  const data = await response.json();
  return data.activities;
}

export async function fetchLastActivities(): Promise<Activity[]> {
  const response = await fetch(`/last.json`);
  const data = await response.json();
  return data.activities;
}

export async function fetchActivity(id: string): Promise<Activity> {
  const response = await fetch(`/activities/${id}.json`);
  return await response.json();
}
