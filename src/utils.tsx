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

export function formatDate(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
}

export function formatPace(speed: number, sport: string): string {
  if (!speed || speed === 0) return "--";

  // speed is already in km/h from the backend
  const kmh = speed;

  if (sport === "running") {
    // For running, show min/km
    const minPerKm = 60 / kmh;
    const minutes = Math.floor(minPerKm);
    const seconds = Math.round((minPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  } else {
    // For cycling, show km/h
    return `${kmh.toFixed(1)} km/h`;
  }
}
