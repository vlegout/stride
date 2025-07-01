import { TracePoint } from "../types";

export interface ProcessedChartData {
  labels: number[];
  speedData: number[];
  hrData: number[];
  altitudeData: number[];
  powerData: number[];
}

export const processTracePointData = (tracePoints: TracePoint[]): ProcessedChartData => {
  const safeTracePoints = tracePoints ?? [];

  return {
    labels: safeTracePoints.map((point: TracePoint) => (point?.distance ?? 0) / 1000),
    speedData: safeTracePoints.map((point: TracePoint) => point?.speed ?? 0),
    hrData: safeTracePoints.map((point: TracePoint) => point?.heart_rate ?? 0),
    altitudeData: safeTracePoints.map((point: TracePoint) => point?.altitude ?? 0),
    powerData: safeTracePoints.map((point: TracePoint) => point?.power ?? 0),
  };
};

export const hasValidData = (data: number[]): boolean => {
  return data?.length > 0 && data.some((value) => value != null && value > 0);
};
