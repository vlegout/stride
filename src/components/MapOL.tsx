import { useEffect, useRef } from "react";
import OLMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { LineString, Point } from "ol/geom";
import { Feature } from "ol";
import { Style, Stroke, Circle, Fill, Text } from "ol/style";
import { fromLonLat } from "ol/proj";
import { MapComponentProps } from "./MapTypes";
import { LatLngExpression } from "leaflet";

const latLngToCoord = (point: LatLngExpression): number[] => {
  const [lat, lng] = Array.isArray(point) ? point : [point.lat, point.lng];
  return fromLonLat([lng, lat]);
};

const MapOLComponent = ({
  bounds,
  points,
  height = "400px",
  width = "400px",
  showMarkers = true,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();

    const coordinates = points.map(latLngToCoord);

    const routeFeature = new Feature({
      geometry: new LineString(coordinates),
    });
    routeFeature.setStyle(
      new Style({
        stroke: new Stroke({ color: "#2563eb", width: 2 }),
      }),
    );
    vectorSource.addFeature(routeFeature);

    if (showMarkers) {
      const createMarker = (coord: number[], text: string, color: string) => {
        const style = new Style({
          image: new Circle({
            radius: 12,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: "white", width: 2 }),
          }),
          text: new Text({
            text,
            fill: new Fill({ color: "white" }),
            font: "bold 12px sans-serif",
            offsetY: 1,
          }),
        });
        const feature = new Feature({ geometry: new Point(coord) });
        feature.setStyle(style);
        return feature;
      };

      vectorSource.addFeature(createMarker(coordinates[0], "S", "#22c55e"));
      vectorSource.addFeature(createMarker(coordinates[coordinates.length - 1], "E", "#ef4444"));
    }

    const map = new OLMap({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: vectorSource })],
      view: new View({ center: [0, 0], zoom: 2 }),
    });

    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    const extent = [fromLonLat([minLng, minLat]), fromLonLat([maxLng, maxLat])].flat();
    map.getView().fit(extent, { padding: [20, 20, 20, 20] });

    return () => map.setTarget(undefined);
  }, [bounds, points, showMarkers]);

  return <div ref={mapRef} style={{ height, width }} />;
};

export default MapOLComponent;
