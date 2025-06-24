import { LatLngBoundsExpression, LatLngExpression, divIcon } from "leaflet";
import { MapContainer, Polyline, TileLayer, Marker } from "react-leaflet";

interface MapProps {
  bounds: LatLngBoundsExpression;
  points?: LatLngExpression[];
  height?: string;
  width?: string;
  showMarkers?: boolean;
}

const startIcon = divIcon({
  html: '<div style="background-color: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">S</div>',
  className: "custom-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const endIcon = divIcon({
  html: '<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">E</div>',
  className: "custom-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapComponent = ({ bounds, points, height = "400px", width = "400px", showMarkers = true }: MapProps) => {
  return (
    <MapContainer bounds={bounds} style={{ height, width }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points && <Polyline positions={points} />}
      {points && showMarkers && points.length > 0 && (
        <>
          <Marker position={points[0]} icon={startIcon} />
          {points.length > 1 && <Marker position={points[points.length - 1]} icon={endIcon} />}
        </>
      )}
    </MapContainer>
  );
};

export default MapComponent;
