import type { Meta, StoryObj } from "@storybook/react-vite";
import MapComponent from "./Map";

const meta = {
  title: "Components/Map",
  component: MapComponent,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Interactive map component using Leaflet that displays GPS tracks as polylines. Takes bounds and points to render a route on OpenStreetMap tiles.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    bounds: {
      description: "Map bounds as LatLngBoundsExpression to fit the view",
      control: false,
    },
    points: {
      description: "Optional array of GPS coordinates to draw as a polyline route",
      control: false,
    },
    height: {
      description: "Height of the map container",
      control: { type: "text" },
    },
    width: {
      description: "Width of the map container",
      control: { type: "text" },
    },
    showMarkers: {
      description: "Show start and end markers on the route",
      control: { type: "boolean" },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "20px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleRoute: Story = {
  args: {
    bounds: [
      [40.7128, -74.006],
      [40.7589, -73.9851],
    ],
    points: [
      [40.7128, -74.006],
      [40.7305, -73.9969],
      [40.7484, -73.9857],
      [40.7589, -73.9851],
    ],
  },
};

export const CircularRoute: Story = {
  args: {
    bounds: [
      [40.7505, -73.9934],
      [40.7812, -73.9581],
    ],
    points: [
      [40.7505, -73.9934],
      [40.7689, -73.9581],
      [40.7812, -73.9734],
      [40.7656, -73.9912],
      [40.7505, -73.9934],
    ],
    height: "300px",
    width: "500px",
    showMarkers: false,
  },
};

export const LongRoute: Story = {
  args: {
    bounds: [
      [40.7128, -74.006],
      [40.8176, -73.9482],
    ],
    points: [
      [40.7128, -74.006],
      [40.7282, -73.9942],
      [40.7484, -73.9857],
      [40.7648, -73.9808],
      [40.7812, -73.9734],
      [40.7956, -73.9629],
      [40.8012, -73.9588],
      [40.8176, -73.9482],
    ],
    height: "250px",
    width: "600px",
  },
};

export const EmptyMap: Story = {
  args: {
    bounds: [
      [40.7128, -74.006],
      [40.7812, -73.9734],
    ],
    height: "200px",
    width: "200px",
    showMarkers: false,
  },
};
