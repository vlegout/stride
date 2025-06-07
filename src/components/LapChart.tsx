import { useState } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [tooltipProps, setTooltipProps] = useState({
    text: "",
    visible: false,
    x: 0,
    y: 0,
  });

  if (laps.some((lap) => lap.minutes == null || lap.seconds == null)) {
    return null;
  }

  // Responsive dimensions
  const containerWidth = isSmall ? 300 : isMobile ? 400 : 500;
  const width = containerWidth;
  const height = isSmall ? 150 : isMobile ? 180 : 200;
  const space = isSmall ? 1 : 2;
  const leftMargin = isSmall ? 25 : 30;

  const minSpeed = Math.min(...laps.map((lap) => lap.minutes * 60 + lap.seconds)) - 10;
  const maxSpeed = Math.max(...laps.map((lap) => lap.minutes * 60 + lap.seconds)) + 10;
  const speedRange = maxSpeed - minSpeed;

  const totalDistance = laps.reduce((sum, lap) => sum + lap.total_distance, 0);

  const dataLaps: LapData[] = [];

  let currentX = leftMargin;

  laps.forEach((lap, index) => {
    const lapWidth = (lap.total_distance * (width - leftMargin - space * laps.length)) / totalDistance;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTouchMove = (e: any) => {
    // Handle touch events for mobile
    const touchPos = e.target.getStage().getPointerPosition();
    if (touchPos) {
      setTooltipProps({
        text: `${e.target.name()}`,
        visible: true,
        x: touchPos.x + 5,
        y: touchPos.y - 30, // Position above finger on touch
      });
    }
  };

  const handleMouseOut = () => {
    setTooltipProps((prev) => ({ ...prev, visible: false }));
  };

  const responsiveFontSize = isSmall ? 12 : 14;
  const tooltipFontSize = isSmall ? 14 : 16;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: width,
        height: "100%",
        position: "relative",
        margin: "auto",
        overflow: "hidden", // Prevent horizontal scroll
        touchAction: "pan-y", // Allow vertical scrolling but prevent horizontal pan conflicts
      }}
    >
      <Stage width={width} height={height + 30}>
        <Layer
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseOut}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseOut}
        >
          {dataLaps.map((lap, index) => (
            <Rect
              key={index}
              x={lap.x}
              y={lap.y}
              width={lap.width}
              height={lap.height}
              name={lap.name}
              fill="lightgrey"
              stroke="white"
              strokeWidth={1}
              // Make bars more touch-friendly on mobile
              {...(isMobile && {
                shadowBlur: 2,
                shadowColor: "rgba(0,0,0,0.3)",
                shadowOffsetY: 1,
              })}
            />
          ))}
        </Layer>
        <Layer>
          <Text
            {...tooltipProps}
            fontSize={tooltipFontSize}
            padding={isMobile ? 8 : 5}
            fill="black"
            fontStyle="bold"
            // Add background for better readability on mobile
            {...(isMobile && {
              align: "center",
              backgroundColor: "rgba(255,255,255,0.9)",
              cornerRadius: 4,
            })}
          />
        </Layer>
        <Layer>
          {paces.map((pace, index) => (
            <Text
              key={index}
              x={0}
              y={height - (height * (maxSpeed - pace)) / speedRange}
              text={`${Math.floor(pace / 60)}:${(pace % 60).toString().padStart(2, "0")}`}
              fontSize={responsiveFontSize}
              fill="#666"
            />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
};

export default LineChart;
