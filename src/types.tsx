import { LatLngExpression } from "leaflet";

export interface Pace {
  minutes: number;
  seconds: number;
}

export interface Lap {
  index: number;
  start_time: string;
  total_elapsed_time: number;
  total_distance: number;
  max_heart_rate: number;
  avg_heart_rate: number;
  max_speed: number;
  pace: Pace;
}

export interface DataPoint {
  timestamp: string;
  distance: number;
  heart_rate: number;
  speed: number;
  power: number;
  altitude: number;
}

export interface Activity {
  id: string;

  fit: string;
  sport: string;
  device: string;

  title: string;
  description: string;

  start_time: string;
  total_timer_time: number;
  total_elapsed_time: number;

  total_distance: number;
  total_ascent: number;

  average_speed: number;

  total_calories: number;

  total_training_effect: number;

  laps: Lap[];
  data_points: DataPoint[];
  trace_points: LatLngExpression[];
  lat: number;
  lon: number;
  delta_lat: number;
  delta_lon: number;
}

export interface Statistic {
  sport: string;
  n_activities: number;
  total_distance: number;
}

export interface YearsStatistics {
  year: number;
  statistics: Statistic[];
}

export interface WeeksStatistics {
  start: string;
  statistics: Statistic[];
}

export interface Profile {
  n_activities: number;
  run_n_activities: number;
  run_total_distance: number;
  cycling_n_activities: number;
  cycling_total_distance: number;
  years: YearsStatistics[];
  weeks: WeeksStatistics[];
}
