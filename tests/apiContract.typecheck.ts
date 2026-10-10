import type { components } from "../src/apiSchema";
import type * as Front from "../src/types";

type Schemas = components["schemas"];

type Assert<_T extends true> = never;
type BackendProvides<Backend, Frontend> = [keyof Frontend] extends [keyof Backend] ? true : false;

// Fails to compile when the frontend expects a field the backend no longer sends.
export type Contract = [
  Assert<BackendProvides<Schemas["ActivityPublic"], Omit<Front.Activity, "notification_count">>>,
  Assert<BackendProvides<Schemas["ActivityPublicWithoutTracepoints"], Pick<Front.Activity, "notification_count">>>,
  Assert<BackendProvides<Schemas["ActivityList"], Front.ActivitiesResponse>>,
  Assert<BackendProvides<Schemas["Pagination"], Front.Pagination>>,
  Assert<BackendProvides<Schemas["Lap"], Front.Lap>>,
  Assert<BackendProvides<Schemas["Tracepoint"], Front.TracePoint>>,
  Assert<BackendProvides<Schemas["Performance"], Front.Performance>>,
  Assert<BackendProvides<Schemas["Profile"], Front.Profile>>,
  Assert<BackendProvides<Schemas["YearsStatistics"], Front.YearsStatistics>>,
  Assert<BackendProvides<Schemas["Statistic"], Front.Statistic>>,
  Assert<BackendProvides<Schemas["ZonePublic"], Front.Zone>>,
  Assert<BackendProvides<Schemas["BestPerformanceResponse"], Front.BestPerformanceResponse>>,
  Assert<BackendProvides<Schemas["BestPerformanceItem"], Front.BestPerformanceItem>>,
  Assert<BackendProvides<Schemas["PowerProfileResponse"], Front.PowerProfileResponse>>,
  Assert<BackendProvides<Schemas["UserPublic"], Front.User>>,
  Assert<BackendProvides<Schemas["UserCreate"], Front.UserCreate>>,
  Assert<BackendProvides<Schemas["UserUpdate"], Front.UserUpdate>>,
  Assert<BackendProvides<Schemas["Token"], Front.Token>>,
  Assert<BackendProvides<Schemas["GoogleAuthResponse"], Front.GoogleAuthResponse>>,
  Assert<BackendProvides<Schemas["ActivityUpdate"], Front.ActivityUpdate>>,
  Assert<BackendProvides<Schemas["WeeksResponse"], Front.WeeksResponse>>,
  Assert<BackendProvides<Schemas["WeeklySummary"], Front.WeeklySummary>>,
  Assert<BackendProvides<Schemas["WeeklyActivitySummary"], Front.WeeklyActivitySummary>>,
  Assert<BackendProvides<Schemas["HeatmapPublic"], Front.HeatmapResponse>>,
  Assert<BackendProvides<Schemas["HeatmapPolyline"], Front.HeatmapPolyline>>,
];
