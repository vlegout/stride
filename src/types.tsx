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

  total_distance: string;

  average_speed: string;

  points: LatLngExpression[];
  lat: number;
  lon: number;
}
