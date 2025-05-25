import { type } from "arktype";

export const Performance = type({
  distance: "number",
  time: "string",
});
export type Performance = typeof Performance.infer;

export const Lap = type({
  index: "number",
  start_time: "string",
  total_elapsed_time: "number",
  total_distance: "number",
  max_heart_rate: "number",
  avg_heart_rate: "number",
  max_speed: "number",
  minutes: "number",
  seconds: "number",
});
export type Lap = typeof Lap.infer;

export const DataPoint = type({
  timestamp: "string",
  distance: "number",
  heart_rate: "number",
  speed: "number",
  power: "number",
  altitude: "number",
});
export type DataPoint = typeof DataPoint.infer;

export const TracePoint = type({
  lat: "number",
  lng: "number",
});
export type TracePoint = typeof TracePoint.infer;

export const Activity = type({
  id: "string.uuid.v5",

  fit: "string",

  title: "string",
  description: "string",

  sport: "string",
  device: "string",

  race: "boolean",

  start_time: "string",
  total_timer_time: "number",
  total_elapsed_time: "number",

  total_distance: "number",
  total_ascent: "number",

  average_speed: "number",

  avg_heart_rate: "number",
  max_heart_rate: "number",

  total_calories: "number",

  total_training_effect: "number",

  lat: "number",
  lon: "number",
  delta_lat: "number",
  delta_lon: "number",
  location: "string",

  laps: [Lap],
  tracepoints: [DataPoint],
  performances: [Performance],
});
export type Activity = typeof Activity.infer;

export const Statistic = type({
  sport: "string",
  n_activities: "number",
  total_distance: "number",
});
export type Statistic = typeof Statistic.infer;

export const YearsStatistics = type({
  year: "number",
  statistics: Statistic.array().atLeastLength(2),
});
export type YearsStatistics = typeof YearsStatistics.infer;

export const WeeksStatistics = type({
  start: "string",
  week: "number",
  statistics: Statistic.array().atLeastLength(2),
});
export type WeeksStatistics = typeof WeeksStatistics.infer;

export const Profile = type({
  n_activities: "number",
  run_n_activities: "number",
  run_total_distance: "number",
  cycling_n_activities: "number",
  cycling_total_distance: "number",
  years: [YearsStatistics],
  weeks: [WeeksStatistics],
  running_performances: [Performance],
});
export type Profile = typeof Profile.infer;
