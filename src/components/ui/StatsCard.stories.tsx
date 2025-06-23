import type { Meta, StoryObj } from "@storybook/react-vite";
import StatsCard from "./StatsCard";

const meta = {
  title: "Components/StatsCard",
  component: StatsCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Displays statistical information in a card format with customizable variants and sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "The title/label for the statistic",
    },
    value: {
      control: "text",
      description: "The statistical value to display",
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle for additional context",
    },
    variant: {
      control: { type: "select" },
      options: ["default", "primary", "secondary"],
      description: "Visual variant of the card",
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
      description: "Size of the card",
    },
  },
} satisfies Meta<typeof StatsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Distance",
    value: "10.5 km",
  },
};

export const Primary: Story = {
  args: {
    title: "Total Time",
    value: "45:30",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    title: "Avg Speed",
    value: "12.3 km/h",
    variant: "secondary",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Elevation Gain",
    value: "342 m",
    subtitle: "Total ascent",
  },
};

export const Small: Story = {
  args: {
    title: "Calories",
    value: "486",
    size: "small",
  },
};

export const Large: Story = {
  args: {
    title: "Duration",
    value: "2h 15m",
    size: "large",
    variant: "primary",
  },
};

export const EmptyValue: Story = {
  args: {
    title: "Heart Rate",
    value: "0",
  },
};
