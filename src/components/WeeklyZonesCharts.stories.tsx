import type { Meta, StoryObj } from "@storybook/react-vite";
import WeeklyZonesCharts from "./WeeklyZonesCharts";
import { WeeklyZoneData } from "../types";

const meta = {
  title: "Components/WeeklyZonesCharts",
  component: WeeklyZonesCharts,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WeeklyZonesCharts>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const generateSampleWeeklyZones = (weeks: number): WeeklyZoneData[] => {
  const data: WeeklyZoneData[] = [];
  const currentDate = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - i * 7);

    // Generate heart rate zones (5 zones)
    const heartRateZones = [];
    for (let zone = 1; zone <= 5; zone++) {
      const baseTime = zone * 600 + i * 200; // Deterministic: 600-3000 seconds
      const runningTime = baseTime * 0.6; // Running gets consistent 60%
      const cyclingTime = baseTime - runningTime;

      heartRateZones.push({
        zone_index: zone,
        total_time: baseTime,
        running_time: runningTime,
        cycling_time: cyclingTime,
        max_value: 120 + zone * 20, // Zone thresholds: 140, 160, 180, 200, 220
      });
    }

    // Generate pace zones (5 zones)
    const paceZones = [];
    for (let zone = 1; zone <= 5; zone++) {
      paceZones.push({
        zone_index: zone,
        total_time: zone * 400 + i * 100, // Deterministic: 400-2400 seconds
        running_time: undefined,
        cycling_time: undefined,
        max_value: 300 + zone * 30, // Pace in seconds per km
      });
    }

    // Generate power zones (7 zones)
    const powerZones = [];
    for (let zone = 1; zone <= 7; zone++) {
      powerZones.push({
        zone_index: zone,
        total_time: zone * 200 + i * 50, // Deterministic: 200-1800 seconds
        running_time: undefined,
        cycling_time: undefined,
        max_value: 150 + zone * 50, // Power in watts
      });
    }

    data.push({
      week_start: weekStart.toISOString().split("T")[0],
      heart_rate_zones: heartRateZones,
      pace_zones: paceZones,
      power_zones: powerZones,
    });
  }

  return data;
};

export const Default: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(12),
  },
};

export const ShortTerm: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(4),
  },
};

export const LongTerm: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(26),
  },
};

export const HighIntensityTraining: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(8).map((week) => ({
      ...week,
      heart_rate_zones: week.heart_rate_zones.map((zone) => ({
        ...zone,
        total_time: zone.zone_index >= 4 ? zone.total_time * 2 : zone.total_time * 0.5,
        running_time: zone.zone_index >= 4 ? (zone.running_time || 0) * 2 : (zone.running_time || 0) * 0.5,
        cycling_time: zone.zone_index >= 4 ? (zone.cycling_time || 0) * 2 : (zone.cycling_time || 0) * 0.5,
      })),
      pace_zones: week.pace_zones.map((zone) => ({
        ...zone,
        total_time: zone.zone_index >= 4 ? zone.total_time * 2 : zone.total_time * 0.5,
      })),
      power_zones: week.power_zones.map((zone) => ({
        ...zone,
        total_time: zone.zone_index >= 5 ? zone.total_time * 2 : zone.total_time * 0.5,
      })),
    })),
  },
};

export const EnduranceTraining: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(8).map((week) => ({
      ...week,
      heart_rate_zones: week.heart_rate_zones.map((zone) => ({
        ...zone,
        total_time: zone.zone_index <= 2 ? zone.total_time * 3 : zone.total_time * 0.3,
        running_time: zone.zone_index <= 2 ? (zone.running_time || 0) * 3 : (zone.running_time || 0) * 0.3,
        cycling_time: zone.zone_index <= 2 ? (zone.cycling_time || 0) * 3 : (zone.cycling_time || 0) * 0.3,
      })),
      pace_zones: week.pace_zones.map((zone) => ({
        ...zone,
        total_time: zone.zone_index <= 2 ? zone.total_time * 3 : zone.total_time * 0.3,
      })),
      power_zones: week.power_zones.map((zone) => ({
        ...zone,
        total_time: zone.zone_index <= 2 ? zone.total_time * 3 : zone.total_time * 0.3,
      })),
    })),
  },
};

export const RunningFocused: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(8).map((week) => ({
      ...week,
      heart_rate_zones: week.heart_rate_zones.map((zone) => ({
        ...zone,
        running_time: zone.total_time * 0.8,
        cycling_time: zone.total_time * 0.2,
      })),
      pace_zones: week.pace_zones.map((zone) => ({
        ...zone,
        total_time: zone.total_time * 2, // More pace work
      })),
      power_zones: week.power_zones.map((zone) => ({
        ...zone,
        total_time: zone.total_time * 0.3, // Less power work
      })),
    })),
  },
};

export const CyclingFocused: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(8).map((week) => ({
      ...week,
      heart_rate_zones: week.heart_rate_zones.map((zone) => ({
        ...zone,
        running_time: zone.total_time * 0.2,
        cycling_time: zone.total_time * 0.8,
      })),
      pace_zones: week.pace_zones.map((zone) => ({
        ...zone,
        total_time: zone.total_time * 0.3, // Less pace work
      })),
      power_zones: week.power_zones.map((zone) => ({
        ...zone,
        total_time: zone.total_time * 2, // More power work
      })),
    })),
  },
};

export const EmptyData: Story = {
  args: {
    weeklyZones: [],
  },
};

export const MinimalData: Story = {
  args: {
    weeklyZones: [
      {
        week_start: "2024-01-01",
        heart_rate_zones: [
          { zone_index: 1, total_time: 1800, running_time: 1200, cycling_time: 600, max_value: 140 },
          { zone_index: 2, total_time: 900, running_time: 600, cycling_time: 300, max_value: 160 },
        ],
        pace_zones: [
          { zone_index: 1, total_time: 1200, running_time: undefined, cycling_time: undefined, max_value: 330 },
        ],
        power_zones: [
          { zone_index: 1, total_time: 900, running_time: undefined, cycling_time: undefined, max_value: 200 },
        ],
      },
    ],
  },
};

export const ProgressiveTraining: Story = {
  args: {
    weeklyZones: generateSampleWeeklyZones(12).map((week, index) => {
      const intensity = index / 11; // Progressive increase
      return {
        ...week,
        heart_rate_zones: week.heart_rate_zones.map((zone) => ({
          ...zone,
          total_time: zone.total_time * (1 + intensity * zone.zone_index * 0.1),
          running_time: (zone.running_time || 0) * (1 + intensity * zone.zone_index * 0.1),
          cycling_time: (zone.cycling_time || 0) * (1 + intensity * zone.zone_index * 0.1),
        })),
        pace_zones: week.pace_zones.map((zone) => ({
          ...zone,
          total_time: zone.total_time * (1 + intensity * zone.zone_index * 0.1),
        })),
        power_zones: week.power_zones.map((zone) => ({
          ...zone,
          total_time: zone.total_time * (1 + intensity * zone.zone_index * 0.1),
        })),
      };
    }),
  },
};
