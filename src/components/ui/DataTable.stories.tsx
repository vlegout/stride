import type { Meta, StoryObj } from "@storybook/react-vite";
import DataTable, { type Column } from "./DataTable";

interface MockData extends Record<string, unknown> {
  id: string;
  name: string;
  age: number;
  city: string;
  score: number;
  active: boolean;
}

const mockData: MockData[] = [
  { id: "1", name: "John Doe", age: 30, city: "New York", score: 85, active: true },
  { id: "2", name: "Jane Smith", age: 25, city: "Los Angeles", score: 92, active: false },
  { id: "3", name: "Bob Johnson", age: 35, city: "Chicago", score: 78, active: true },
  { id: "4", name: "Alice Brown", age: 28, city: "Miami", score: 89, active: true },
  { id: "5", name: "Charlie Wilson", age: 32, city: "Seattle", score: 76, active: false },
];

const columns: Column<MockData>[] = [
  { id: "name", label: "Name", sortable: true },
  { id: "age", label: "Age", sortable: true, align: "center" },
  { id: "city", label: "City" },
  { id: "score", label: "Score", sortable: true, align: "right" },
  {
    id: "active",
    label: "Status",
    render: (value) => (value ? "Active" : "Inactive"),
  },
];

const meta = {
  title: "Components/DataTable",
  component: DataTable<MockData>,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Reusable data table component with sorting, responsive design, and customizable columns.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    responsive: {
      control: "boolean",
      description: "Whether the table should be responsive",
    },
    stickyHeader: {
      control: "boolean",
      description: "Whether the header should stick to the top",
    },
  },
} satisfies Meta<typeof DataTable<MockData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns,
    rows: mockData,
  },
};

export const WithSorting: Story = {
  args: {
    columns,
    rows: mockData,
    sortColumn: "name",
    sortDirection: "asc",
    onSort: (column: string) => console.log("Sort by:", column),
  },
};

export const StickyHeader: Story = {
  args: {
    columns,
    rows: mockData,
    stickyHeader: true,
    maxHeight: 300,
  },
};

export const EmptyTable: Story = {
  args: {
    columns,
    rows: [],
    emptyMessage: "No data to display",
  },
};

export const CustomEmptyMessage: Story = {
  args: {
    columns,
    rows: [],
    emptyMessage: "Start by adding some records",
  },
};
