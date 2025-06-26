import type { Meta, StoryObj } from "@storybook/react-vite";
import LoadingIndicator from "./LoadingIndicator";

const meta = {
  title: "Components/LoadingIndicator",
  component: LoadingIndicator,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A loading indicator component that displays a circular progress spinner with customizable message text.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    message: {
      control: "text",
      description: "The loading message to display below the spinner",
    },
  },
} satisfies Meta<typeof LoadingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomMessage: Story = {
  args: {
    message: "Please wait while we process your data...",
  },
};

export const ShortMessage: Story = {
  args: {
    message: "Saving...",
  },
};

export const LongMessage: Story = {
  args: {
    message: "Loading your running activities and calculating performance metrics. This may take a few moments.",
  },
};
