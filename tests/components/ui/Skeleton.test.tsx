import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Skeleton, {
  SkeletonCard,
  SkeletonStats,
  SkeletonChart,
  SkeletonTable,
} from "../../../src/components/ui/Skeleton";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("Skeleton", () => {
  it("should render", () => {
    const { container } = renderWithTheme(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SkeletonCard", () => {
  it("should render", () => {
    const { container } = renderWithTheme(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SkeletonStats", () => {
  it("should render", () => {
    const { container } = renderWithTheme(<SkeletonStats />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SkeletonChart", () => {
  it("should render", () => {
    const { container } = renderWithTheme(<SkeletonChart />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SkeletonTable", () => {
  it("should render", () => {
    const { container } = renderWithTheme(<SkeletonTable />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
