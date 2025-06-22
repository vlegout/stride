import { type } from "arktype";

export const ActivitiesQueryParams = type({
  sport: "string",
  distance: "number[]",
  fetchMap: "boolean",
  limit: "number",
  race: "boolean",
  page: "number",
  order: "'asc'|'desc'",
  orderBy: "string",
});
export type ActivitiesQueryParams = typeof ActivitiesQueryParams.infer;

export const Performance = type({
  distance: "number",
  time: "string",
});
export type Performance = typeof Performance.infer;

export const Lap = type({
  index: "number",
  start_time: "number",
  total_elapsed_time: "number",
  total_distance: "number",
  max_heart_rate: "number",
  avg_heart_rate: "number",
  max_speed: "number",
  minutes: "number",
  seconds: "number",
});
export type Lap = typeof Lap.infer;

export const TracePoint = type({
  lat: "number",
  lng: "number",
  timestamp: "string",
  distance: "number",
  heart_rate: "number",
  speed: "number",
  power: "number",
  altitude: "number",
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

  start_time: "number",
  total_timer_time: "number",
  total_elapsed_time: "number",

  total_distance: "number",
  total_ascent: "number",

  avg_speed: "number",

  avg_heart_rate: "number",
  max_heart_rate: "number",

  avg_power: "number",
  max_power: "number",
  np_power: "number",

  total_calories: "number",

  total_training_effect: "number",
  training_stress_score: "number",
  intensity_factor: "number",

  lat: "number",
  lon: "number",
  delta_lat: "number",
  delta_lon: "number",
  city: "string?",
  country: "string?",

  laps: [Lap],
  tracepoints: [TracePoint],
  performances: [Performance],
});
export type Activity = typeof Activity.infer;

export const Pagination = type({
  page: "number",
  per_page: "number",
  total: "number",
});
export type Pagination = typeof Pagination.infer;

export const ActivitiesResponse = type({
  activities: Activity.array(),
  pagination: Pagination,
});
export type ActivitiesResponse = typeof ActivitiesResponse.infer;

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

export const User = type({
  id: "string",
  first_name: "string",
  last_name: "string",
  email: "string",
  google_id: "string",
  google_picture: "string?",
  created_at: "string",
  updated_at: "string",
});
export type User = typeof User.infer;

export const UserCreate = type({
  first_name: "string",
  last_name: "string",
  email: "string",
  google_id: "string",
  google_picture: "string?",
});
export type UserCreate = typeof UserCreate.infer;

export const Token = type({
  access_token: "string",
  token_type: "string",
  expires_in: "number",
});
export type Token = typeof Token.infer;

export const GoogleAuthResponse = type({
  user: User,
  token: Token,
});
export type GoogleAuthResponse = typeof GoogleAuthResponse.infer;

export const WeeklyActivitySummary = type({
  id: "string.uuid.v5",
  title: "string",
  sport: "string",
  start_time: "number",
  total_distance: "number",
  total_timer_time: "number",
  avg_speed: "number",
  avg_heart_rate: "number?",
  avg_power: "number?",
  race: "boolean",
});
export type WeeklyActivitySummary = typeof WeeklyActivitySummary.infer;

export const WeeklySummary = type({
  week_start: "string",
  week_number: "number",
  year: "number",
  activities: WeeklyActivitySummary.array(),
  total_activities: "number",
  total_distance: "number",
  total_time: "number",
  sports_breakdown: "unknown",
});
export type WeeklySummary = typeof WeeklySummary.infer;

export const WeeksResponse = type({
  weeks: WeeklySummary.array(),
});
export type WeeksResponse = typeof WeeksResponse.infer;
