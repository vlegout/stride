import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Box,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export interface Column<T = Record<string, unknown>> {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string | number;
  render?: (value: unknown, row: T) => ReactNode;
  format?: (value: unknown) => string;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  minWidth?: string | number;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  emptyMessage?: string;
  responsive?: boolean;
  showHeader?: boolean;
}

const DataTable = <T extends Record<string, unknown>>({
  columns,
  rows,
  sortColumn,
  sortDirection = "asc",
  onSort,
  minWidth = 650,
  stickyHeader = false,
  maxHeight,
  emptyMessage = "No data available",
  responsive = true,
  showHeader = true,
}: DataTableProps<T>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const tableSize = responsive && isMobile ? "small" : "medium";

  const handleSort = (columnId: string): void => {
    if (onSort) {
      onSort(columnId);
    }
  };

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    const value = row[column.id];

    if (column.render) {
      return column.render(value, row);
    }

    if (column.format) {
      return column.format(value);
    }

    return value as React.ReactNode;
  };

  const getResponsiveStyles = (column: Column<T>) => {
    if (!responsive || !isMobile) return {};

    return {
      fontSize: "0.75rem",
      padding: "8px",
      ...(column.width && { width: column.width }),
    };
  };

  if (rows.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight,
        overflowX: "auto",
      }}
    >
      <Table
        sx={{
          minWidth,
          "& .MuiTableCell-root": {
            whiteSpace: responsive ? "nowrap" : "normal",
          },
        }}
        size={tableSize}
        stickyHeader={stickyHeader}
        aria-label="data table"
      >
        {showHeader && (
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  sortDirection={sortColumn === column.id ? sortDirection : false}
                  sx={{
                    fontWeight: "bold",
                    ...getResponsiveStyles(column),
                  }}
                >
                  {column.sortable && onSort ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : "asc"}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={((row as Record<string, unknown>).id as string) || index}
              hover
              sx={{
                "&:nth-of-type(odd)": {
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || "left"} sx={getResponsiveStyles(column)}>
                  {getCellValue(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
