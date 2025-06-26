import { DateTime, Duration } from "luxon";
import type { Sport } from "./types";

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

export function formatDate(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
}

export function formatPace(speed: number, sport: Sport): string {
  if (!speed || speed === 0) return "--";

  if (sport === "running") {
    const minPerKm = 60 / speed;
    const minutes = Math.floor(minPerKm);
    const seconds = Math.round((minPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  } else {
    return `${speed.toFixed(1)} km/h`;
  }
}

export function isTokenValid(token: string | null, tokenExpiry: number | null): boolean {
  return !!(token && tokenExpiry && Date.now() < tokenExpiry);
}
