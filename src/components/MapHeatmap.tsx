import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
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

function calculateCenter(polylines: HeatmapPolyline[]): LatLngExpression {
  const startPoints = polylines.map((p) => p.coordinates[0]).filter((c): c is [number, number] => c !== undefined);

  if (startPoints.length === 0) {
    return [0, 0];
  }

  const lats = startPoints.map((p) => p[0]).sort((a, b) => a - b);
  const lons = startPoints.map((p) => p[1]).sort((a, b) => a - b);

  const mid = Math.floor(lats.length / 2);
  const medianLat = lats.length % 2 ? lats[mid] : (lats[mid - 1] + lats[mid]) / 2;
  const medianLon = lons.length % 2 ? lons[mid] : (lons[mid - 1] + lons[mid]) / 2;

  return [medianLat, medianLon];
}

const MapHeatmap = ({ polylines, height = "600px", width = "100%" }: MapHeatmapProps) => {
  if (polylines.length === 0) {
    return null;
  }

  const center = calculateCenter(polylines);

  return (
    <MapContainer center={center} zoom={8} style={{ height, width }} preferCanvas={true}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {polylines.map((polyline, index) => (
        <Polyline
          // biome-ignore lint/suspicious/noArrayIndexKey: polylines have no unique identifier
          key={index}
          positions={polyline.coordinates as [number, number][]}
          pathOptions={{
            color: SPORT_COLORS[polyline.sport] || "#6366f1",
            weight: 3,
            opacity: 0.6,
          }}
        />
      ))}
    </MapContainer>
  );
};

export default MapHeatmap;
