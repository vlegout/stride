import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DataTable, { Column } from "../../../src/components/ui/DataTable";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

afterEach(() => {
  cleanup();
});

interface TestRow {
  id: string;
  name: string;
  distance: number;
  duration: number;
  [key: string]: unknown;
}

const mockColumns: Column<TestRow>[] = [
  { id: "name", label: "Name" },
  { id: "distance", label: "Distance", align: "right" },
  { id: "duration", label: "Duration", align: "right" },
];

const mockRows: TestRow[] = [
  { id: "1", name: "Morning Run", distance: 5000, duration: 1800 },
  { id: "2", name: "Evening Ride", distance: 25000, duration: 3600 },
];

describe("DataTable", () => {
  describe("rendering", () => {
    it("should render column headers", () => {
      renderWithTheme(<DataTable<TestRow> columns={mockColumns} rows={mockRows} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Distance")).toBeInTheDocument();
      expect(screen.getByText("Duration")).toBeInTheDocument();
    });

    it("should render row data", () => {
      renderWithTheme(<DataTable<TestRow> columns={mockColumns} rows={mockRows} />);
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Evening Ride")).toBeInTheDocument();
    });

    it("should render empty message when no rows", () => {
      renderWithTheme(<DataTable<TestRow> columns={mockColumns} rows={[]} />);
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should render custom empty message", () => {
      renderWithTheme(<DataTable<TestRow> columns={mockColumns} rows={[]} emptyMessage="No activities found" />);
      expect(screen.getByText("No activities found")).toBeInTheDocument();
    });

    it("should hide header when showHeader is false", () => {
      const { container } = renderWithTheme(
        <DataTable<TestRow> columns={mockColumns} rows={mockRows} showHeader={false} />,
      );
      const headers = container.querySelectorAll("thead th");
      expect(headers.length).toBe(0);
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
    });

    it("should have aria-label for accessibility", () => {
      renderWithTheme(<DataTable<TestRow> columns={mockColumns} rows={mockRows} />);
      expect(screen.getByRole("table")).toHaveAttribute("aria-label", "data table");
    });
  });

  describe("sorting", () => {
    it("should call onSort when sortable column header is clicked", () => {
      const handleSort = vi.fn();
      const sortableColumns: Column<TestRow>[] = [
        { id: "name", label: "Name", sortable: true },
        { id: "distance", label: "Distance", sortable: true },
      ];
      renderWithTheme(<DataTable<TestRow> columns={sortableColumns} rows={mockRows} onSort={handleSort} />);

      const nameHeader = screen.getByText("Name");
      fireEvent.click(nameHeader);
      expect(handleSort).toHaveBeenCalledWith("name");
    });

    it("should show sort indicator on active sort column", () => {
      const sortableColumns: Column<TestRow>[] = [{ id: "name", label: "Name", sortable: true }];
      const { container } = renderWithTheme(
        <DataTable<TestRow>
          columns={sortableColumns}
          rows={mockRows}
          sortColumn="name"
          sortDirection="asc"
          onSort={vi.fn()}
        />,
      );
      const sortLabel = container.querySelector(".MuiTableSortLabel-root");
      expect(sortLabel).toBeInTheDocument();
    });

    it("should not show sort button when column is not sortable", () => {
      const nonSortableColumns: Column<TestRow>[] = [{ id: "name", label: "Name", sortable: false }];
      const { container } = renderWithTheme(<DataTable<TestRow> columns={nonSortableColumns} rows={mockRows} />);
      const sortButtons = container.querySelectorAll(".MuiTableSortLabel-root");
      expect(sortButtons.length).toBe(0);
    });
  });

  describe("custom rendering", () => {
    it("should use custom render function when provided", () => {
      const columnsWithRender: Column<TestRow>[] = [
        {
          id: "distance",
          label: "Distance",
          render: (value) => <span data-testid="custom-distance">{(value as number) / 1000} km</span>,
        },
      ];
      renderWithTheme(<DataTable<TestRow> columns={columnsWithRender} rows={[mockRows[0]]} />);
      expect(screen.getByTestId("custom-distance")).toHaveTextContent("5 km");
    });

    it("should use format function when provided", () => {
      const columnsWithFormat: Column<TestRow>[] = [
        {
          id: "distance",
          label: "Distance",
          format: (value) => `${(value as number) / 1000} km`,
        },
      ];
      renderWithTheme(<DataTable<TestRow> columns={columnsWithFormat} rows={[mockRows[0]]} />);
      expect(screen.getByText("5 km")).toBeInTheDocument();
    });
  });
});
