import { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";

const Map = ({ bounds, points }: { bounds: LatLngBoundsExpression; points: LatLngExpression[] }) => {
  return (
    <MapContainer bounds={bounds} style={{ height: "400px", width: "400px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={points} />
    </MapContainer>
  );
};

export default Map;
