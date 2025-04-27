import { LatLngExpression } from "leaflet";

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

  points: LatLngExpression[];
  lat: number;
  lon: number;
}
