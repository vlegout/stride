import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, IconButton } from "@mui/material";
import { Add, Settings } from "@mui/icons-material";
import PageHeader from "./PageHeader";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Page header component with title, subtitle, breadcrumbs, and action buttons.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ padding: "20px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["h4", "h5", "h6"],
      description: "Title variant",
    },
    spacing: {
      control: { type: "select" },
      options: ["compact", "normal", "spacious"],
      description: "Spacing around the header",
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Dashboard",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Activity Details",
    subtitle: "View and analyze your activity data",
  },
};

export const WithActions: Story = {
  args: {
    title: "Activities",
    subtitle: "Manage your training activities",
    actions: (
      <>
        <IconButton>
          <Settings />
        </IconButton>
        <Button variant="contained" startIcon={<Add />}>
          Add Activity
        </Button>
      </>
    ),
  },
};

export const Complete: Story = {
  args: {
    title: "Activity Analysis",
    subtitle: "Detailed view of your training session",
    actions: (
      <Button variant="outlined" startIcon={<Settings />}>
        Settings
      </Button>
    ),
  },
};

export const SmallVariant: Story = {
  args: {
    title: "Settings",
    subtitle: "Configure your preferences",
    variant: "h6",
    spacing: "compact",
  },
};

export const SpaciousLayout: Story = {
  args: {
    title: "Training Dashboard",
    subtitle: "Overview of your fitness journey",
    spacing: "spacious",
  },
};
