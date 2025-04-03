import './App.css'

import axios from 'axios'

import { useEffect, useState } from 'react';

interface Activity {
  fit: string;
  sport: string;
  start_time: string;
  total_distance: string;
}

function App() {
  const [activities, setActivities] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    axios.get('/data.json')
      .then(response => {
        const data: Activity[] = response.data.activities;
        const activityElements = data.map(activity => (
        <ul>
          <li>Sport: {activity.sport}</li>
          <li>Start Time: {activity.start_time}</li>
          <li>Total Distance: {activity.total_distance}</li>
        </ul>
        ));
        setActivities(activityElements);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <>
      <h1>Hello World</h1>
      <ul>
        { activities }
      </ul>
    </>
  )
}

export default App
