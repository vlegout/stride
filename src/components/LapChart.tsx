import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { Stage, Layer, Rect, Text } from "react-konva";

import { Lap } from "../types";

interface LapData {
  index: number;
  total_distance: number;
  pace: { minutes: number; seconds: number };
  x: number;
  width: number;
  height: number;
  name: string;
}

const LineChart = ({ laps }: { laps: Lap[] }) => {
  const [tooltipProps, setTooltipProps] = useState({
    text: "",
    visible: false,
    x: 0,
    y: 0,
  });

  const width = 500;
  const height = 200;
  const space = 2;

  const minSpeed = Math.min(...laps.map((lap) => lap.pace.minutes * 60 + lap.pace.seconds)) - 10;
  const maxSpeed = Math.max(...laps.map((lap) => lap.pace.minutes * 60 + lap.pace.seconds)) + 10;
  const speedRange = maxSpeed - minSpeed;

  const totalDistance = laps.reduce((sum, lap) => sum + lap.total_distance, 0);

  const dataLaps: LapData[] = [];

  let currentX = 40;

  laps.forEach((lap, index) => {
    const lapWidth = (lap.total_distance * (width - 40 - space * laps.length)) / totalDistance;
    const lapHeight = (-height * (maxSpeed - (lap.pace.minutes * 60 + lap.pace.seconds))) / speedRange;

    dataLaps.push({
      index: index,
      total_distance: lap.total_distance,
      pace: lap.pace,
      x: currentX,
      y: height + 10,
      width: lapWidth,
      height: lapHeight,
      name: `${lap.pace.minutes}:${lap.pace.seconds.toString().padStart(2, "0")}`,
    });

    currentX += lapWidth + space;
  });

  let modulo = 15;
  if (speedRange > 240) {
    modulo = 60;
  } else if (speedRange > 120) {
    modulo = 30;
  }

  const paces = [];
  let currentSpeed = minSpeed;
  while (currentSpeed <= maxSpeed) {
    currentSpeed += 1;

    if (currentSpeed % modulo === 0) {
      paces.push(currentSpeed);
    }
  }

  const handleMouseMove = (e) => {
    const mousePos = e.target.getStage().getPointerPosition();
    setTooltipProps({
      text: `${e.target.name()}`,
      visible: true,
      x: mousePos.x + 5,
      y: mousePos.y + 5,
    });
  };

  const handleMouseOut = () => {
    setTooltipProps((prev) => ({ ...prev, visible: false }));
  };

  return (
    <Box paddingTop="10px">
      <Stage width={window.innerWidth} height={height + 30}>
        <Layer onMouseMove={handleMouseMove} onMouseOut={handleMouseOut}>
          {dataLaps.map((lap) => (
            <Rect x={lap.x} y={lap.y} width={lap.width} height={lap.height} name={lap.name} fill="lightgrey" />
          ))}
        </Layer>
        <Layer>
          <Text {...tooltipProps} fontSize={16} padding={5} />
        </Layer>
        <Layer>
          {paces.map((pace) => (
            <Text
              x={0}
              y={height - (height * (maxSpeed - pace)) / speedRange}
              text={`${Math.floor(pace / 60)}:${(pace % 60).toString().padStart(2, "0")}`}
              fontSize={16}
            />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
};

export default LineChart;
