import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, TooltipItem } from "chart.js";
import { Bar } from "react-chartjs-2";

import { fetchActivity } from "../api";

import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";

import { Lap } from "../types";

const ActivityComponent = () => {
  const params = useParams();

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activityId"],
    queryFn: async () => fetchActivity(params.id as string),
  });

  if (isPending || isFetching || error) return "Loading...";

  ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

  const options = {
    responsive: true,
    scales: {
      y: {
        max: Math.max(...data.laps.map((lap: Lap) => lap.pace.minutes + lap.pace.seconds / 60)) + 0.2,
        min: Math.min(...data.laps.map((lap: Lap) => lap.pace.minutes + lap.pace.seconds / 60)) - 0.2,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">): string {
            return (
              Math.floor(context.raw as number) +
              ":" +
              Math.floor(60 * ((context.raw as number) % 1))
                .toString()
                .padStart(2, "0")
            );
          },
        },
      },
    },
  };

  const barData = {
    labels: data.laps.map((lap: Lap) => lap.index),
    datasets: [
      {
        data: data.laps.map((lap: Lap) => lap.pace.minutes + lap.pace.seconds / 60),
      },
    ],
  };

  return (
    <Flex>
      <Box padding="10px" width="50vw">
        <Box>
          <Heading>{data.title}</Heading>
          <Text>{data.description}</Text>
          <ul>
            <li>Sport: {data.sport}</li>
            <li>Start Time: {formatDateTime(data.start_time)}</li>
            <li>Total Timer Time: {formatDuration(data.total_timer_time)}</li>
            <li>Total Elapsed Time: {formatDuration(data.total_elapsed_time)}</li>
            <li>Total Distance: {formatDistance(data.total_distance)}</li>
            <li>Total Ascent: {data.total_ascent}</li>
            <li>Total Calories: {data.total_calories}</li>
            <li>Total Training Effect: {data.total_training_effect}</li>
            <li>Average Speed: {formatSpeed(data.average_speed)}</li>
          </ul>
        </Box>
        <Box maxWidth="500px">
          <Bar options={options} data={barData} />
        </Box>
      </Box>

      <Box padding="10px" width="50vw">
        <MapContainer center={[data.lat, data.lon]} zoom={12} style={{ height: "500px", width: "500px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={data.trace_points} />
        </MapContainer>
      </Box>
    </Flex>
  );
};

export default ActivityComponent;
