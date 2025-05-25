import { DateTime, Duration } from "luxon";

export function formatSpeed(speed: number): string {
  if (speed == null) return "";

  return `${speed.toFixed(2)} km/h`;
}

export function formatDistance(distance: number): string {
  return `${(distance / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  return Duration.fromObject({ seconds: Math.floor(seconds) })
    .rescale()
    .toHuman({ unitDisplay: "narrow" });
}

export function formatDateTime(datetime: string): string {
  return DateTime.fromSQL(datetime).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
}
