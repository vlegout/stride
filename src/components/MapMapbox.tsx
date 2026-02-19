import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapComponentProps } from "./MapTypes";

const MapMapbox = ({ bounds, points, height = "400px", width = "400px", showMarkers = true }: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapboxToken) return;
    if (map.current) return;
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [centerLng, centerLat],
      zoom: 12,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: points.map(([lat, lon]) => [lon, lat]),
          },
        },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#3388ff",
          "line-width": 3,
        },
      });

      map.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 20,
        },
      );

      if (showMarkers && points.length > 0) {
        const startMarker = document.createElement("div");
        startMarker.style.backgroundColor = "green";
        startMarker.style.width = "12px";
        startMarker.style.height = "12px";
        startMarker.style.borderRadius = "50%";
        startMarker.style.border = "2px solid white";

        new mapboxgl.Marker(startMarker).setLngLat([points[0][1], points[0][0]]).addTo(map.current);

        const endMarker = document.createElement("div");
        endMarker.style.backgroundColor = "red";
        endMarker.style.width = "12px";
        endMarker.style.height = "12px";
        endMarker.style.borderRadius = "50%";
        endMarker.style.border = "2px solid white";

        new mapboxgl.Marker(endMarker)
          .setLngLat([points[points.length - 1][1], points[points.length - 1][0]])
          .addTo(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [bounds, points, showMarkers]);

  if (!mapboxToken) {
    return (
      <div
        style={{
          height,
          width,
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Mapbox token not found
      </div>
    );
  }

  return <div ref={mapContainer} style={{ width, height }} />;
};

export default MapMapbox;
