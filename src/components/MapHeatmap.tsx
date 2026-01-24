import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { HeatmapPolyline } from "../types";

const SPORT_COLORS: Record<string, string> = {
  running: "#ef4444",
  cycling: "#3b82f6",
  swimming: "#22c55e",
};

interface MapHeatmapProps {
  polylines: HeatmapPolyline[];
  height?: string;
  width?: string;
}

function calculateBounds(polylines: HeatmapPolyline[]): LatLngBoundsExpression {
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;

  for (const polyline of polylines) {
    for (const [lat, lon] of polyline.coordinates) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
  }

  const padding = 0.01;
  return [
    [minLat - padding, minLon - padding],
    [maxLat + padding, maxLon + padding],
  ];
}

const MapHeatmap = ({ polylines, height = "600px", width = "100%" }: MapHeatmapProps) => {
  if (polylines.length === 0) {
    return null;
  }

  const bounds = calculateBounds(polylines);

  return (
    <MapContainer bounds={bounds} style={{ height, width }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {polylines.map((polyline, index) => (
        <Polyline
          key={index}
          positions={polyline.coordinates as [number, number][]}
          pathOptions={{
            color: SPORT_COLORS[polyline.sport] || "#6366f1",
            weight: 2,
            opacity: 0.6,
          }}
        />
      ))}
    </MapContainer>
  );
};

export default MapHeatmap;
