import type { Meta, StoryObj } from "@storybook/react-vite";
import ZoneTables from "./ZoneTables";
import { Zone } from "../types";

const meta: Meta<typeof ZoneTables> = {
  title: "Components/ZoneTables",
  component: ZoneTables,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleZones: Zone[] = [
  // Heart rate zones
  { id: "hr-1", user_id: "user1", index: 1, type: "heart_rate", max_value: 114 },
  { id: "hr-2", user_id: "user1", index: 2, type: "heart_rate", max_value: 133 },
  { id: "hr-3", user_id: "user1", index: 3, type: "heart_rate", max_value: 152 },
  { id: "hr-4", user_id: "user1", index: 4, type: "heart_rate", max_value: 171 },
  { id: "hr-5", user_id: "user1", index: 5, type: "heart_rate", max_value: 190 },

  // Pace zones
  { id: "pace-1", user_id: "user1", index: 1, type: "pace", max_value: 390 },
  { id: "pace-2", user_id: "user1", index: 2, type: "pace", max_value: 360 },
  { id: "pace-3", user_id: "user1", index: 3, type: "pace", max_value: 330 },
  { id: "pace-4", user_id: "user1", index: 4, type: "pace", max_value: 300 },
  { id: "pace-5", user_id: "user1", index: 5, type: "pace", max_value: 270 },

  // Power zones
  { id: "power-1", user_id: "user1", index: 1, type: "power", max_value: 138 },
  { id: "power-2", user_id: "user1", index: 2, type: "power", max_value: 184 },
  { id: "power-3", user_id: "user1", index: 3, type: "power", max_value: 230 },
  { id: "power-4", user_id: "user1", index: 4, type: "power", max_value: 264 },
  { id: "power-5", user_id: "user1", index: 5, type: "power", max_value: 310 },
];

export const AllZones: Story = {
  args: {
    zones: sampleZones,
  },
};

export const HeartRateOnly: Story = {
  args: {
    zones: sampleZones.filter((zone) => zone.type === "heart_rate"),
  },
};

export const PaceOnly: Story = {
  args: {
    zones: sampleZones.filter((zone) => zone.type === "pace"),
  },
};

export const PowerOnly: Story = {
  args: {
    zones: sampleZones.filter((zone) => zone.type === "power"),
  },
};

export const NoZones: Story = {
  args: {
    zones: [],
  },
};
