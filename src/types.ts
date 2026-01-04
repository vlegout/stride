import { type } from "arktype";

export const Sport = type("'running'|'cycling'|'swimming'");
export type Sport = typeof Sport.infer;

export const DistanceRange = type(["number", "number"]);
export type DistanceRange = typeof DistanceRange.infer;

export const NonEmptyString = type("string")
  .pipe((s) => s.trim())
  .narrow((s, ctx) => (s.length > 0 ? true : ctx.mustBe("a non-empty string")));
export type NonEmptyString = typeof NonEmptyString.infer;

export const FileExtension = type("string").narrow((name, ctx) => {
  const lower = name.toLowerCase();
  return lower.endsWith(".fit") || lower.endsWith(".zip") ? true : ctx.mustBe("a .fit or .zip file");
});
export type FileExtension = typeof FileExtension.infer;

export const ActivitiesQueryParams = type({
  sport: Sport.or("undefined"),
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
  activity_id: "string.uuid.v5",
});
export type Performance = typeof Performance.infer;

export const PowerPerformance = type({
  time: "string",
  power: "number",
  activity_id: "string.uuid.v5",
});
export type PowerPerformance = typeof PowerPerformance.infer;

export const Notification = type({
  id: "string.uuid.v4",
  activity_id: "string.uuid.v5",
  type: "'best_effort_yearly'|'best_effort_all_time'",
  distance: "number | null",
  duration: "string | null",
  power: "number | null",
  achievement_year: "number | null",
  rank: "number | null",
  message: "string",
  created_at: "string",
});
export type Notification = typeof Notification.infer;

export const Lap = type({
  index: "number",
  start_time: "number",
  total_elapsed_time: "number",
  total_timer_time: "number",
  total_distance: "number",
  max_heart_rate: "number",
  avg_heart_rate: "number",
  max_speed: "number | null",
});
export type Lap = typeof Lap.infer;

export const TracePoint = type({
  lat: "number?",
  lon: "number?",
  timestamp: "string",
  distance: "number",
  heart_rate: "number",
  speed: "number",
  cadence: "number | null",
  power: "number | null",
  altitude: "number?",
  temperature: "number | null",
});
export type TracePoint = typeof TracePoint.infer;

export const Activity = type({
  id: "string.uuid.v5",

  fit: "string",

  title: "string",
  description: "string",

  sport: Sport,
  device: "string",

  race: "boolean",

  start_time: "number",
  total_timer_time: "number",
  total_elapsed_time: "number",

  total_distance: "number",
  total_ascent: "number | null",

  avg_speed: "number | null",

  avg_heart_rate: "number",
  max_heart_rate: "number",

  avg_cadence: "number | null",
  max_cadence: "number | null",

  avg_power: "number | null",
  max_power: "number | null",
  np_power: "number | null",

  total_calories: "number | null",

  total_training_effect: "number | null",
  training_stress_score: "number | null",
  intensity_factor: "number | null",

  avg_temperature: "number | null",
  max_temperature: "number | null",
  min_temperature: "number | null",

  pool_length: "number | null",
  num_lengths: "number | null",

  lat: "number",
  lon: "number",
  delta_lat: "number",
  delta_lon: "number",
  city: "string | null",
  country: "string | null",

  laps: Lap.array().optional(),
  tracepoints: TracePoint.array().optional(),
  performances: Performance.array().optional(),
  performance_power: PowerPerformance.array().optional(),
  notifications: Notification.array().optional(),
  "notification_count?": "number | null",
});
export type Activity = typeof Activity.infer;

export const ActivityUpdate = type({
  "title?": NonEmptyString,
  race: "boolean?",
});
export type ActivityUpdate = typeof ActivityUpdate.infer;

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
  sport: Sport,
  n_activities: "number",
  total_distance: "number",
});
export type Statistic = typeof Statistic.infer;

export const YearsStatistics = type({
  year: "number",
  statistics: Statistic.array().atLeastLength(3),
});
export type YearsStatistics = typeof YearsStatistics.infer;

export const WeeksStatistics = type({
  start: "string",
  week: "number",
  statistics: Statistic.array().atLeastLength(3),
});
export type WeeksStatistics = typeof WeeksStatistics.infer;

export const Zone = type({
  id: "string.uuid.v4",
  user_id: "string",
  index: "number",
  type: "'heart_rate'|'pace'|'power'",
  max_value: "number",
});
export type Zone = typeof Zone.infer;

export const Profile = type({
  n_activities: "number",
  run_n_activities: "number",
  run_total_distance: "number",
  cycling_n_activities: "number",
  cycling_total_distance: "number",
  swimming_n_activities: "number",
  swimming_total_distance: "number",
  years: YearsStatistics.array(),
  zones: Zone.array(),
});
export type Profile = typeof Profile.infer;

export const BestPerformanceItem = type({
  value: "number",
  activity: Activity,
});
export type BestPerformanceItem = typeof BestPerformanceItem.infer;

export const BestPerformanceResponse = type({
  sport: "string",
  parameter: "string",
  performances: BestPerformanceItem.array(),
});
export type BestPerformanceResponse = typeof BestPerformanceResponse.infer;

export const User = type({
  id: "string",
  first_name: "string",
  last_name: "string",
  email: "string",
  google_id: "string",
  google_picture: "string?",
  map: "'leaflet'|'openlayers'|'mapbox'",
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

export const UserUpdate = type({
  map: "'leaflet'|'openlayers'|'mapbox'?",
});
export type UserUpdate = typeof UserUpdate.infer;

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
  sport: Sport,
  start_time: "number",
  total_distance: "number",
  total_timer_time: "number",
  avg_speed: "number | null",
  avg_heart_rate: "number | null",
  avg_power: "number | null",
  race: "boolean",
});
export type WeeklyActivitySummary = typeof WeeklyActivitySummary.infer;

const SportsBreakdownItem = type({
  distance: "number",
  time: "number",
  count: "number",
});

export const WeeklySummary = type({
  week_start: "string",
  week_number: "number",
  year: "number",
  activities: WeeklyActivitySummary.array(),
  total_activities: "number",
  total_distance: "number",
  total_time: "number",
  total_tss: "number",
  sports_breakdown: { "[string]": SportsBreakdownItem },
});
export type WeeklySummary = typeof WeeklySummary.infer;

export const WeeksResponse = type({
  weeks: WeeklySummary.array(),
});
export type WeeksResponse = typeof WeeksResponse.infer;

export const FitnessScore = type({
  date: "string",
  overall: "number",
  running: "number",
  cycling: "number",
  swimming: "number",
});
export type FitnessScore = typeof FitnessScore.infer;

export const WeeklyTSS = type({
  week_start: "string",
  total_tss: "number",
});
export type WeeklyTSS = typeof WeeklyTSS.infer;

export const WeeklyActivityData = type({
  week_start: "string",
  distance: "number",
  time: "number",
});
export type WeeklyActivityData = typeof WeeklyActivityData.infer;

export const FtpData = type({
  date: "string",
  ftp: "number",
});
export type FtpData = typeof FtpData.infer;

export const ZoneTimeData = type({
  zone_index: "number",
  total_time: "number",
  running_time: "number?",
  cycling_time: "number?",
  max_value: "number",
});
export type ZoneTimeData = typeof ZoneTimeData.infer;

export const WeeklyZoneData = type({
  week_start: "string",
  heart_rate_zones: ZoneTimeData.array(),
  pace_zones: ZoneTimeData.array(),
  power_zones: ZoneTimeData.array(),
});
export type WeeklyZoneData = typeof WeeklyZoneData.infer;

export const FitnessResponse = type({
  scores: FitnessScore.array(),
  weekly_tss: WeeklyTSS.array(),
  weekly_running: WeeklyActivityData.array(),
  weekly_cycling: WeeklyActivityData.array(),
  weekly_swimming: WeeklyActivityData.array(),
  weekly_zones: WeeklyZoneData.array(),
  ftp: FtpData.array(),
});
export type FitnessResponse = typeof FitnessResponse.infer;

export const ActivityZoneRaw = type({
  id: "string",
  activity_id: "string",
  zone_id: "string",
  time_in_zone: "number",
  zone: {
    id: "string",
    user_id: "string",
    index: "number",
    type: "string",
    max_value: "number",
  },
});
export type ActivityZoneRaw = typeof ActivityZoneRaw.infer;

export const ActivityZonesRawResponse = type({
  pace: ActivityZoneRaw.array().optional(),
  power: ActivityZoneRaw.array().optional(),
  heart_rate: ActivityZoneRaw.array().optional(),
});
export type ActivityZonesRawResponse = typeof ActivityZonesRawResponse.infer;
