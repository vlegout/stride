import type { Meta, StoryObj } from "@storybook/react-vite";
import Performances from "./Performances";
import { MemoryRouter } from "react-router-dom";

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
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Performances>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    performances: [
      { distance: 1000, time: "PT3M30S", activity_id: "550e8400-e29b-41d4-a716-446655440001" },
      { distance: 5000, time: "PT18M0S", activity_id: "550e8400-e29b-41d4-a716-446655440002" },
      { distance: 10000, time: "PT37M0S", activity_id: "550e8400-e29b-41d4-a716-446655440003" },
    ],
  },
};

export const Empty: Story = {
  args: {
    performances: [],
  },
};
