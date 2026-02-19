import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Box } from "@mui/material";
import DateSelector, { type DateRangeOption } from "./DateSelector";

const meta = {
  title: "Components/DateSelector",
  component: DateSelector,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    selectedRange: {
      control: { type: "select" },
      options: ["30d", "90d", "6m", "1y"],
    },
  },
} satisfies Meta<typeof DateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveDateSelector = ({ initialRange = "1y" }: { initialRange?: DateRangeOption }) => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>(initialRange);

  return (
    <Box sx={{ p: 3 }}>
      <DateSelector selectedRange={selectedRange} onChange={setSelectedRange} />
    </Box>
  );
};

const noop = () => {
  // Intentionally empty for story args
};

export const Default: Story = {
  args: {
    selectedRange: "1y",
    onChange: noop,
  },
  render: () => <InteractiveDateSelector initialRange="1y" />,
};

export const ThirtyDays: Story = {
  args: {
    selectedRange: "30d",
    onChange: noop,
  },
  render: () => <InteractiveDateSelector initialRange="30d" />,
};

export const OneYear: Story = {
  args: {
    selectedRange: "1y",
    onChange: noop,
  },
  render: () => <InteractiveDateSelector initialRange="1y" />,
};
