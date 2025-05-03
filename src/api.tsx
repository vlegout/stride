import type { Activity } from "./types";

export async function fetchActivities({ queryKey }: { queryKey: [string] }): Promise<Activity[]> {
  const [sport] = queryKey;
  const response = await fetch(`/activities.json`);
  const data = await response.json();

  if (sport === "all") {
    return data.activities;
  }

  return data.activities.filter((activity: Activity) => activity.sport === sport);
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
