import { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";

interface MapProps {
  bounds: LatLngBoundsExpression;
  points?: LatLngExpression[];
  height?: string;
  width?: string;
}

const Map = ({ bounds, points, height = "400px", width = "400px" }: MapProps) => {
  return (
    <MapContainer bounds={bounds} style={{ height, width }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points && <Polyline positions={points} />}
    </MapContainer>
  );
};

export default Map;
