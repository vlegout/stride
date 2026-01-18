import { useState } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Lap, Sport } from "../types";

interface LapData {
  index: number;
  total_distance: number;
  total_timer_time: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
}

const LineChart = ({ laps, sport }: { laps: Lap[]; sport: Sport }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [tooltipProps, setTooltipProps] = useState({
    text: "",
    visible: false,
    x: 0,
    y: 0,
  });

  if (sport == "swimming") {
    return null;
  }
  if (laps.some((lap) => lap.total_timer_time == null || lap.total_distance == null) || laps.length <= 1) {
    return null;
  }

  const containerWidth = isSmall ? 300 : isMobile ? 400 : 500;
  const width = containerWidth;
  const height = isSmall ? 150 : isMobile ? 180 : 200;
  const space = isSmall ? 1 : 2;
  const leftMargin = isSmall ? 35 : 40;
  const rightMargin = isSmall ? 30 : 35;

  const isCycling = sport === "cycling";

  const getSpeedKmh = (lap: Lap): number => {
    const timeInSeconds = lap.total_timer_time;
    const speedMps = lap.total_distance / timeInSeconds;
    return speedMps * 3.6;
  };

  const getPaceSecondsPerKm = (lap: Lap): number => {
    const timeInSeconds = lap.total_timer_time;
    const distanceInKm = lap.total_distance / 1000;
    return timeInSeconds / distanceInKm;
  };

  const values = isCycling ? laps.map(getSpeedKmh) : laps.map(getPaceSecondsPerKm);

  const minValue = Math.min(...values) - (isCycling ? 2 : 10);
  const maxValue = Math.max(...values) + (isCycling ? 2 : 10);
  const valueRange = maxValue - minValue;

  const getColor = (value: number): string => {
    const normalizedValue = isCycling ? (value - minValue) / valueRange : (maxValue - value) / valueRange;
    const intensity = Math.max(0, Math.min(1, normalizedValue));

    // Interpolate between slow (slate gray) and fast (primary orange)
    // colors.chart.lap.slow = #94A3B8, colors.chart.lap.fast = #FF6B35
    const slowRgb = { r: 148, g: 163, b: 184 };
    const fastRgb = { r: 255, g: 107, b: 53 };

    const r = Math.round(slowRgb.r + (fastRgb.r - slowRgb.r) * intensity);
    const g = Math.round(slowRgb.g + (fastRgb.g - slowRgb.g) * intensity);
    const b = Math.round(slowRgb.b + (fastRgb.b - slowRgb.b) * intensity);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const totalDistance = laps.reduce((sum, lap) => sum + lap.total_distance, 0);

  const dataLaps: LapData[] = [];

  let currentX = leftMargin;

  laps.forEach((lap, index) => {
    const lapWidth = (lap.total_distance * (width - leftMargin - rightMargin - space * laps.length)) / totalDistance;
    const currentValue = isCycling ? getSpeedKmh(lap) : getPaceSecondsPerKm(lap);
    const lapHeight = isCycling
      ? (-height * (currentValue - minValue)) / valueRange
      : (-height * (maxValue - currentValue)) / valueRange;

    const displayName = isCycling
      ? `${currentValue.toFixed(1)}`
      : (() => {
          const totalSeconds = Math.round(currentValue);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        })();

    dataLaps.push({
      index: index,
      total_distance: lap.total_distance,
      total_timer_time: lap.total_timer_time,
      x: currentX,
      y: height + 10,
      width: lapWidth,
      height: lapHeight,
      name: displayName,
      color: getColor(currentValue),
    });

    currentX += lapWidth + space;
  });

  let modulo = isCycling ? 5 : 15;
  if (!isCycling) {
    if (valueRange > 240) {
      modulo = 60;
    } else if (valueRange > 120) {
      modulo = 30;
    }
  } else {
    if (valueRange > 20) {
      modulo = 10;
    } else if (valueRange > 10) {
      modulo = 5;
    } else {
      modulo = 2;
    }
  }

  const yAxisLabels = [];
  if (isCycling) {
    const startValue = Math.ceil(minValue / modulo) * modulo;
    for (let value = startValue; value <= maxValue; value += modulo) {
      yAxisLabels.push(value);
    }
  } else {
    let currentValue = minValue;
    while (currentValue <= maxValue) {
      currentValue += 1;
      if (Math.round(currentValue) % modulo === 0) {
        yAxisLabels.push(currentValue);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any): void => {
    const mousePos = e.target.getStage().getPointerPosition();
    setTooltipProps({
      text: `${e.target.name()}`,
      visible: true,
      x: mousePos.x + 5,
      y: mousePos.y + 5,
    });
  };

  const handleMouseOut = (): void => {
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
        overflow: "hidden",
        touchAction: "pan-y",
      }}
    >
      <Stage width={width} height={height + 30}>
        <Layer onMouseMove={handleMouseMove} onMouseOut={handleMouseOut} onTouchEnd={handleMouseOut}>
          {dataLaps.map((lap, index) => (
            <Rect
              key={index}
              x={lap.x}
              y={lap.y}
              width={lap.width}
              height={lap.height}
              name={lap.name}
              fill={lap.color}
              stroke="white"
              strokeWidth={1}
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
            {...(isMobile && {
              align: "center",
              backgroundColor: "rgba(255,255,255,0.9)",
              cornerRadius: 4,
            })}
          />
        </Layer>
        <Layer>
          {yAxisLabels.map((value, index) => {
            const labelText = isCycling
              ? `${value.toFixed(0)}`
              : `${Math.floor(value / 60)}:${(Math.round(value) % 60).toString().padStart(2, "0")}`;

            return (
              <Text
                key={index}
                x={0}
                y={
                  isCycling
                    ? height - (height * (value - minValue)) / valueRange
                    : height - (height * (maxValue - value)) / valueRange
                }
                text={labelText}
                fontSize={responsiveFontSize}
                fill="#666"
              />
            );
          })}
        </Layer>
      </Stage>
    </Box>
  );
};

export default LineChart;
