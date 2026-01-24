import { useRef } from "react";
import { ChartOptions, Chart, Plugin, Decimation } from "chart.js";
import { Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { colors, hexToRgb } from "../colors";

Chart.register(zoomPlugin, Decimation);

interface LineChartProps {
  labels: number[];
  data: number[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  unit?: string;
}

const primaryRgb = hexToRgb(colors.chart.primary);

const crosshairPlugin: Plugin<"line"> = {
  id: "crosshair",
  afterDraw: (chart: Chart<"line">) => {
    const tooltip = chart.tooltip;
    if (tooltip && tooltip.opacity > 0) {
      const ctx = chart.ctx;
      const x = tooltip.caretX;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  },
};

const LineChart = ({ labels, data, title, xAxisLabel, yAxisLabel, unit }: LineChartProps) => {
  const chartRef = useRef<Chart<"line">>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const filteredData = data.filter((d) => d !== null && d !== undefined);
  const dataMin = filteredData.length > 0 ? Math.min(...filteredData) : 0;
  const dataMax = filteredData.length > 0 ? Math.max(...filteredData) : 100;
  const dataRange = dataMax - dataMin;
  const yPadding = dataRange > 0 ? dataRange * 0.1 : 10;

  const handleResetZoom = () => {
    chartRef.current?.resetZoom();
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: "easeOutQuart",
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    scales: {
      x: {
        type: "linear",
        max: labels.length > 0 ? Math.max(...labels) : 100,
        grid: {
          display: !isSmall,
          color: "rgba(0, 0, 0, 0.06)",
          lineWidth: 1,
        },
        border: {
          dash: [2, 2],
        },
        ticks: {
          font: {
            size: isSmall ? 10 : 12,
          },
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel || "",
          font: {
            size: isSmall ? 11 : 13,
          },
        },
      },
      y: {
        min: dataMin - yPadding,
        max: dataMax + yPadding,
        grid: {
          display: !isSmall,
          color: "rgba(0, 0, 0, 0.06)",
          lineWidth: 1,
        },
        border: {
          dash: [2, 2],
        },
        ticks: {
          font: {
            size: isSmall ? 10 : 12,
          },
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel || "",
          font: {
            size: isSmall ? 11 : 13,
          },
        },
      },
    },
    elements: {
      point: {
        radius: isSmall ? 1 : 0,
        hoverRadius: isMobile ? 6 : 4,
        hitRadius: isMobile ? 12 : 8,
      },
      line: {
        tension: 0.1,
        borderJoinStyle: "round",
        borderCapStyle: "round",
      },
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: "lttb",
        samples: 500,
      },
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        titleFont: {
          size: isSmall ? 12 : 14,
        },
        bodyFont: {
          size: isSmall ? 11 : 13,
        },
        padding: isMobile ? 12 : 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null) return "";
            const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
            return unit ? `${formattedValue} ${unit}` : formattedValue;
          },
          title: (items) => {
            if (items.length > 0) {
              const x = items[0].parsed.x;
              if (x === null) return "";
              return `${x.toFixed(2)} km`;
            }
            return "";
          },
        },
      },
      zoom: {
        pan: {
          enabled: !isSmall,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: !isSmall,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
      },
    },
  };

  const lineData = {
    labels: labels,
    datasets: [
      {
        data: data,
        borderWidth: isMobile ? 3 : 2,
        borderColor: colors.chart.primary,
        fill: true,
        backgroundColor: (context: {
          chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } };
        }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return colors.chart.primaryLight;
          const { r, g, b } = hexToRgb(colors.chart.primary);
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.02)`);
          return gradient;
        },
      },
    ],
  };

  const chartHeight = isSmall ? 140 : isMobile ? 160 : 180;

  return (
    <Box sx={{ width: "100%" }}>
      {title && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: isSmall ? 14 : 16,
              fontWeight: 500,
              color: "text.primary",
            }}
          >
            {title}
          </Typography>
          {!isSmall && (
            <IconButton
              size="small"
              onClick={handleResetZoom}
              sx={{
                opacity: 0.6,
                "&:hover": { opacity: 1 },
                p: 0.5,
              }}
              title="Reset zoom"
            >
              <ZoomOutMapIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      )}
      <Box
        sx={{
          width: "100%",
          height: `${chartHeight}px`,
          touchAction: "pan-y",
        }}
      >
        <Line ref={chartRef} options={lineOptions} data={lineData} plugins={[crosshairPlugin]} />
      </Box>
    </Box>
  );
};

export default LineChart;
