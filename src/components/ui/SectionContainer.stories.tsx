import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography, Box, Chip } from "@mui/material";
import SectionContainer from "./SectionContainer";

const SampleContent = () => (
  <Box>
    <Typography variant="body1" paragraph>
      This is sample content inside the section container. It demonstrates how the container wraps and styles the
      content within it.
    </Typography>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <Chip label="Tag 1" size="small" />
      <Chip label="Tag 2" size="small" />
      <Chip label="Tag 3" size="small" />
    </Box>
  </Box>
);

const meta = {
  title: "Components/SectionContainer",
  component: SectionContainer,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Container component for organizing content sections with optional title, actions, and styling variants.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["paper"],
      description: "Visual variant of the container",
    },
    spacing: {
      control: { type: "select" },
      options: ["compact"],
      description: "Spacing inside the container",
    },
    elevation: {
      control: { type: "number", min: 0, max: 24 },
      description: "Elevation for paper variant",
    },
  },
} satisfies Meta<typeof SectionContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
};

export const WithTitle: Story = {
  args: {
    title: "Section Title",
    children: <SampleContent />,
  },
};

export const PaperVariant: Story = {
  args: {
    title: "Paper Container",
    variant: "paper",
    elevation: 3,
    children: <SampleContent />,
  },
};

export const CompactSpacing: Story = {
  args: {
    title: "Compact Section",
    spacing: "compact",
    variant: "paper",
    children: <SampleContent />,
  },
};

export const CenteredContent: Story = {
  args: {
    title: "Centered Section",
    centered: true,
    maxWidth: 600,
    variant: "paper",
    children: <SampleContent />,
  },
};
