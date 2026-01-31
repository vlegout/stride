import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { Button } from "@mui/material";
import EmptyState from "../../../src/components/ui/EmptyState";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

afterEach(() => {
  cleanup();
});

describe("EmptyState", () => {
  it("should render title", () => {
    renderWithTheme(<EmptyState title="No activities found" />);
    expect(screen.getByText("No activities found")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    renderWithTheme(<EmptyState title="No activities" description="Upload your first activity to get started" />);
    expect(screen.getByText("No activities")).toBeInTheDocument();
    expect(screen.getByText("Upload your first activity to get started")).toBeInTheDocument();
  });

  it("should not render description when not provided", () => {
    const { container } = renderWithTheme(<EmptyState title="No activities" />);
    const descriptions = container.querySelectorAll("p");
    expect(descriptions.length).toBe(0);
  });

  it("should render icon when provided", () => {
    renderWithTheme(<EmptyState title="No results" icon={<SearchOffIcon data-testid="search-icon" />} />);
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("should not render icon when not provided", () => {
    const { container } = renderWithTheme(<EmptyState title="No results" />);
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBe(0);
  });

  it("should render action when provided", () => {
    renderWithTheme(<EmptyState title="No activities" action={<Button data-testid="upload-btn">Upload</Button>} />);
    expect(screen.getByTestId("upload-btn")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });
});
