import type { Meta, StoryObj } from "@storybook/react-vite";
import ActivityLogo from "./ActivityLogo";

const meta = {
  title: "Components/ActivityLogo",
  component: ActivityLogo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays sport-specific logos based on the activity type. Supports cycling and running with customizable width.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    sport: {
      control: { type: "select" },
      options: ["cycling", "running", "unknown"],
      description: "The type of sport activity",
    },
    width: {
      control: { type: "number", min: 10, max: 200, step: 10 },
      description: "Width and height of the logo in pixels",
    },
  },
} satisfies Meta<typeof ActivityLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cycling: Story = {
  args: {
    sport: "cycling",
    width: 40,
  },
};

export const Running: Story = {
  args: {
    sport: "running",
    width: 40,
  },
};
