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

export function formatDateTime(datetime: number): string {
  return DateTime.fromSeconds(datetime).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
}

export function formatInterval(timedelta: string): string {
  return Duration.fromISO(timedelta).toFormat("hh:mm:ss");
}
