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

  heart_rate: number;
  speed: number;
  power: number;
  altitude: number;
}

export interface Activity {
  id: string;

  fit: string;
  sport: string;

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
}
