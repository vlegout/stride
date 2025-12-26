import { DateTime, Duration } from "luxon";
import type { Sport, TracePoint } from "./types";

export interface ProcessedChartData {
  labels: number[];
  speedData: number[];
  hrData: number[];
  altitudeData: number[];
  cadenceData: number[];
  powerData: number[];
  temperatureData: number[];
}

function formatRunningPace(speed: number): string {
  const minPerKm = 60 / speed;
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

export function formatSpeed(speed: number, sport?: Sport, fallback = ""): string {
  if (speed == null || speed === 0) return fallback;

  if (sport === "swimming") {
    const pacePerHundredMeters = 6 / speed;
    const minutes = Math.floor(pacePerHundredMeters);
    const seconds = Math.round((pacePerHundredMeters - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /100m`;
  } else if (sport === "running") {
    return formatRunningPace(speed);
  } else {
    return `${speed.toFixed(1)} km/h`;
  }
}

export function formatDistance(distance: number): string {
  return `${(distance / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "—";

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

export function isTokenValid(token: string | null, tokenExpiry: number | null): boolean {
  return !!(token && tokenExpiry && Date.now() < tokenExpiry);
}

export const processTracePointData = (tracePoints: TracePoint[]): ProcessedChartData => {
  const safeTracePoints = tracePoints ?? [];

  return {
    labels: safeTracePoints.map((point: TracePoint) => (point?.distance ?? 0) / 1000),
    speedData: safeTracePoints.map((point: TracePoint) => point?.speed ?? 0),
    hrData: safeTracePoints.map((point: TracePoint) => point?.heart_rate ?? 0),
    altitudeData: safeTracePoints.map((point: TracePoint) => {
      const altitude = point?.altitude ?? 0;
      return altitude > 10000 ? NaN : altitude;
    }),
    cadenceData: safeTracePoints.map((point: TracePoint) => point?.cadence ?? 0),
    powerData: safeTracePoints.map((point: TracePoint) => point?.power ?? 0),
    temperatureData: safeTracePoints.map((point: TracePoint) => point?.temperature ?? 0),
  };
};

export const hasValidData = (data: number[]): boolean => {
  return data?.length > 0 && data.some((value) => value != null && value > 0);
};
