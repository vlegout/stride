import type { Activity } from "./types";

export async function fetchActivities({ queryKey }: { queryKey: [string, number[]] }): Promise<Activity[]> {
  const [sport, distance] = queryKey;
  const response = await fetch(`/activities.json`);
  const data = await response.json();

  if (sport === "all") {
    return data.activities.filter(
      (activity: Activity) =>
        activity.total_distance >= distance[0] * 1000 &&
        (distance[1] === 100 || activity.total_distance <= distance[1] * 1000),
    );
  }

  return data.activities.filter(
    (activity: Activity) =>
      activity.sport === sport &&
      activity.total_distance >= distance[0] * 1000 &&
      (distance[1] === 100 || activity.total_distance <= distance[1] * 1000),
  );
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
