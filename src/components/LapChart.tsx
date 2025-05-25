import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { Stage, Layer, Rect, Text } from "react-konva";

import { Lap } from "../types";

interface LapData {
  index: number;
  total_distance: number;
  minutes: number;
  seconds: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

const LineChart = ({ laps }: { laps: Lap[] }) => {
  if (laps.some((lap) => lap.minutes == null || lap.seconds == null)) {
    return null;
  }

  const [tooltipProps, setTooltipProps] = useState({
    text: "",
    visible: false,
    x: 0,
    y: 0,
  });

  const width = 500;
  const height = 200;
  const space = 2;

  const minSpeed = Math.min(...laps.map((lap) => lap.minutes * 60 + lap.seconds)) - 10;
  const maxSpeed = Math.max(...laps.map((lap) => lap.minutes * 60 + lap.seconds)) + 10;
  const speedRange = maxSpeed - minSpeed;

  const totalDistance = laps.reduce((sum, lap) => sum + lap.total_distance, 0);

  const dataLaps: LapData[] = [];

  let currentX = 30;

  laps.forEach((lap, index) => {
    const lapWidth = (lap.total_distance * (width - 30 - space * laps.length)) / totalDistance;
    const lapHeight = (-height * (maxSpeed - (lap.minutes * 60 + lap.seconds))) / speedRange;

    dataLaps.push({
      index: index,
      total_distance: lap.total_distance,
      minutes: lap.minutes,
      seconds: lap.seconds,
      x: currentX,
      y: height + 10,
      width: lapWidth,
      height: lapHeight,
      name: `${lap.minutes}:${lap.seconds.toString().padStart(2, "0")}`,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
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
              fontSize={14}
            />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
};

export default LineChart;
