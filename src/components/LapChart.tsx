import { useCallback, useMemo, useState } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { KonvaEventObject } from "konva/lib/Node";

import { Lap, Sport } from "../types";
import { colors, hexToRgb } from "../colors";

const CYCLING_VALUE_PADDING = 2;
const RUNNING_VALUE_PADDING = 10;

const PACE_MODULO_THRESHOLDS = { high: 240, medium: 120 };
const SPEED_MODULO_THRESHOLDS = { high: 20, medium: 10 };

const PACE_MODULO_VALUES = { high: 60, medium: 30, low: 15 };
const SPEED_MODULO_VALUES = { high: 10, medium: 5, low: 2 };

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

interface TooltipProps {
  text: string;
  visible: boolean;
  x: number;
  y: number;
}

const formatPace = (seconds: number): string => {
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

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

const LapChart = ({ laps, sport }: { laps: Lap[]; sport: Sport }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [tooltipProps, setTooltipProps] = useState<TooltipProps>({
    text: "",
    visible: false,
    x: 0,
    y: 0,
  });

  const hasValidData =
    laps.length > 1 && laps.every((lap) => lap.total_timer_time != null && lap.total_distance != null);

  const isCycling = sport === "cycling";

  const containerWidth = isSmall ? 300 : isMobile ? 400 : 500;
  const width = containerWidth;
  const height = isSmall ? 150 : isMobile ? 180 : 200;
  const space = isSmall ? 1 : 2;
  const leftMargin = isSmall ? 35 : 40;
  const rightMargin = isSmall ? 30 : 35;

  const values = useMemo(() => (isCycling ? laps.map(getSpeedKmh) : laps.map(getPaceSecondsPerKm)), [laps, isCycling]);

  const { minValue, maxValue, valueRange } = useMemo(() => {
    if (values.length === 0) {
      return { minValue: 0, maxValue: 0, valueRange: 1 };
    }
    const padding = isCycling ? CYCLING_VALUE_PADDING : RUNNING_VALUE_PADDING;
    const min = Math.min(...values) - padding;
    const max = Math.max(...values) + padding;
    return { minValue: min, maxValue: max, valueRange: max - min };
  }, [values, isCycling]);

  const getColor = useCallback(
    (value: number): string => {
      const normalizedValue = isCycling ? (value - minValue) / valueRange : (maxValue - value) / valueRange;
      const intensity = Math.max(0, Math.min(1, normalizedValue));

      const slowRgb = hexToRgb(colors.chart.lap.slow);
      const fastRgb = hexToRgb(colors.chart.lap.fast);

      const r = Math.round(slowRgb.r + (fastRgb.r - slowRgb.r) * intensity);
      const g = Math.round(slowRgb.g + (fastRgb.g - slowRgb.g) * intensity);
      const b = Math.round(slowRgb.b + (fastRgb.b - slowRgb.b) * intensity);

      return `rgb(${r}, ${g}, ${b})`;
    },
    [isCycling, minValue, maxValue, valueRange],
  );

  const totalDistance = useMemo(() => laps.reduce((sum, lap) => sum + lap.total_distance, 0), [laps]);

  const dataLaps = useMemo(() => {
    const result: LapData[] = [];
    let currentX = leftMargin;

    laps.forEach((lap, index) => {
      const lapWidth = (lap.total_distance * (width - leftMargin - rightMargin - space * laps.length)) / totalDistance;
      const currentValue = isCycling ? getSpeedKmh(lap) : getPaceSecondsPerKm(lap);
      const lapHeight = isCycling
        ? (-height * (currentValue - minValue)) / valueRange
        : (-height * (maxValue - currentValue)) / valueRange;

      const displayName = isCycling ? `${currentValue.toFixed(1)}` : formatPace(currentValue);

      result.push({
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

    return result;
  }, [
    laps,
    leftMargin,
    rightMargin,
    width,
    height,
    space,
    totalDistance,
    isCycling,
    minValue,
    maxValue,
    valueRange,
    getColor,
  ]);

  const modulo = useMemo(() => {
    if (isCycling) {
      if (valueRange > SPEED_MODULO_THRESHOLDS.high) {
        return SPEED_MODULO_VALUES.high;
      } else if (valueRange > SPEED_MODULO_THRESHOLDS.medium) {
        return SPEED_MODULO_VALUES.medium;
      }
      return SPEED_MODULO_VALUES.low;
    } else {
      if (valueRange > PACE_MODULO_THRESHOLDS.high) {
        return PACE_MODULO_VALUES.high;
      } else if (valueRange > PACE_MODULO_THRESHOLDS.medium) {
        return PACE_MODULO_VALUES.medium;
      }
      return PACE_MODULO_VALUES.low;
    }
  }, [isCycling, valueRange]);

  const yAxisLabels = useMemo(() => {
    const labels: number[] = [];
    if (isCycling) {
      const startValue = Math.ceil(minValue / modulo) * modulo;
      for (let value = startValue; value <= maxValue; value += modulo) {
        labels.push(value);
      }
    } else {
      let currentValue = minValue;
      while (currentValue <= maxValue) {
        currentValue += 1;
        if (Math.round(currentValue) % modulo === 0) {
          labels.push(currentValue);
        }
      }
    }
    return labels;
  }, [isCycling, minValue, maxValue, modulo]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>): void => {
    const stage = e.target.getStage();
    if (!stage) return;
    const mousePos = stage.getPointerPosition();
    if (!mousePos) return;
    setTooltipProps({
      text: `${e.target.name()}`,
      visible: true,
      x: mousePos.x + 5,
      y: mousePos.y + 5,
    });
  }, []);

  const handleTouchStart = useCallback((e: KonvaEventObject<TouchEvent>): void => {
    const stage = e.target.getStage();
    if (!stage) return;
    const touchPos = stage.getPointerPosition();
    if (!touchPos) return;
    setTooltipProps({
      text: `${e.target.name()}`,
      visible: true,
      x: touchPos.x + 5,
      y: touchPos.y + 5,
    });
  }, []);

  const handleMouseOut = useCallback((): void => {
    setTooltipProps((prev) => ({ ...prev, visible: false }));
  }, []);

  if (sport === "swimming" || !hasValidData) {
    return null;
  }

  const responsiveFontSize = isSmall ? 12 : 14;
  const tooltipFontSize = isSmall ? 14 : 16;

  const textColor = theme.palette.mode === "dark" ? "#aaa" : "#666";
  const tooltipTextColor = theme.palette.mode === "dark" ? "#fff" : "#000";
  const strokeColor = theme.palette.mode === "dark" ? "#333" : "#fff";
  const tooltipBgColor = theme.palette.mode === "dark" ? "rgba(50,50,50,0.9)" : "rgba(255,255,255,0.9)";

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
      role="img"
      aria-label={`Lap ${isCycling ? "speed" : "pace"} chart showing ${laps.length} laps`}
    >
      <Stage width={width} height={height + 30}>
        <Layer
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseOut}
          onTouchStart={handleTouchStart}
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
              fill={lap.color}
              stroke={strokeColor}
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
            fill={tooltipTextColor}
            fontStyle="bold"
            {...(isMobile && {
              align: "center",
              backgroundColor: tooltipBgColor,
              cornerRadius: 4,
            })}
          />
        </Layer>
        <Layer>
          {yAxisLabels.map((value, index) => {
            const labelText = isCycling ? `${value.toFixed(0)}` : formatPace(value);

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
                fill={textColor}
              />
            );
          })}
        </Layer>
      </Stage>
    </Box>
  );
};

export default LapChart;
