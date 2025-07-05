import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import PowerPerformances from "./PowerPerformances";
import { MemoryRouter } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const meta: Meta<typeof PowerPerformances> = {
  title: "Components/PowerPerformances",
  component: PowerPerformances,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    performances: [
      { time: "PT1M", power: 400, activity_id: "550e8400-e29b-41d4-a716-446655440001" },
      { time: "PT5M", power: 350, activity_id: "550e8400-e29b-41d4-a716-446655440002" },
      { time: "PT10M", power: 320, activity_id: "550e8400-e29b-41d4-a716-446655440003" },
      { time: "PT20M", power: 300, activity_id: "550e8400-e29b-41d4-a716-446655440004" },
      { time: "PT1H", power: 280, activity_id: "550e8400-e29b-41d4-a716-446655440005" },
      { time: "PT2H", power: 260, activity_id: "550e8400-e29b-41d4-a716-446655440006" },
    ],
  },
};

export const Empty: Story = {
  args: {
    performances: [],
  },
};
