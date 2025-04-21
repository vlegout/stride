import "./App.css";

import axios from "axios";

import "leaflet/dist/leaflet.css";

import { MapContainer, Polyline, TileLayer } from "react-leaflet";

import { LatLngExpression } from "leaflet";

import { useEffect, useState } from "react";

interface Activity {
  id: string;

  fit: string;
  sport: string;

  title: string;
  description: string;

  end: string;
  start_time: string;
  total_timer_time: string;
  total_elapsed_time: string;

  total_distance: string;

  average_speed: string;

  points: Array<LatLngExpression>;
  lat: number;
  lon: number;
}

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    axios
      .get("/last.json")
      .then((response) => {
        setActivities(response.data.activities);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <>
      <h1>Activities</h1>
      <div>
        {activities.map((activity) => (
          <div key={activity.id}>
            <ul>
              <li>Title: {activity.title}</li>
              <li>Description: {activity.description}</li>
              <li>Sport: {activity.sport}</li>
              <li>Start Time: {activity.start_time}</li>
              <li>Total Distance: {activity.total_distance}</li>
              <li>Average Speed: {activity.average_speed}</li>
            </ul>
            <MapContainer
              center={[activity.lat, activity.lon]}
              zoom={12}
              style={{ height: "500px", width: "500px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={activity.points} />
            </MapContainer>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
