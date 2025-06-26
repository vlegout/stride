import type { Meta, StoryObj } from "@storybook/react-vite";
import Performances from "./Performances";

const meta = {
  title: "Components/Performances",
  component: Performances,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A component to display a table of performances.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    performances: {
      description: "An array of performance objects.",
      control: false,
    },
  },
} satisfies Meta<typeof Performances>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    performances: [
      { distance: 1000, time: "PT3M30S" },
      { distance: 5000, time: "PT18M0S" },
      { distance: 10000, time: "PT37M0S" },
    ],
  },
};

export const Empty: Story = {
  args: {
    performances: [],
  },
};
