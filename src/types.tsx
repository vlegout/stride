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

  average_speed: number;

  points: LatLngExpression[];
  lat: number;
  lon: number;
}
