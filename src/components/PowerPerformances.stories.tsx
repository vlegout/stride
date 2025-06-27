import type { Meta, StoryObj } from "@storybook/react-vite";
import PowerPerformances from "./PowerPerformances";

const meta: Meta<typeof PowerPerformances> = {
  title: "Components/PowerPerformances",
  component: PowerPerformances,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    performances: [
      { time: "PT1M", power: 400 },
      { time: "PT5M", power: 350 },
      { time: "PT10M", power: 320 },
      { time: "PT20M", power: 300 },
      { time: "PT1H", power: 280 },
      { time: "PT2H", power: 260 },
    ],
  },
};

export const Empty: Story = {
  args: {
    performances: [],
  },
};
