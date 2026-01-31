import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Button } from "@mui/material";
import ContentCard from "../../../src/components/ui/ContentCard";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

afterEach(() => {
  cleanup();
});

describe("ContentCard", () => {
  describe("rendering", () => {
    it("should render children", () => {
      renderWithTheme(
        <ContentCard>
          <p>Card content</p>
        </ContentCard>,
      );
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      renderWithTheme(
        <ContentCard title="Activity Details">
          <p>Content</p>
        </ContentCard>,
      );
      expect(screen.getByText("Activity Details")).toBeInTheDocument();
    });

    it("should render subtitle when provided", () => {
      renderWithTheme(
        <ContentCard title="Activity" subtitle="Last updated today">
          <p>Content</p>
        </ContentCard>,
      );
      expect(screen.getByText("Activity")).toBeInTheDocument();
      expect(screen.getByText("Last updated today")).toBeInTheDocument();
    });

    it("should render headerAction when provided", () => {
      renderWithTheme(
        <ContentCard title="Stats" headerAction={<Button data-testid="action-btn">Edit</Button>}>
          <p>Content</p>
        </ContentCard>,
      );
      expect(screen.getByTestId("action-btn")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("should not render header when no title or headerAction", () => {
      const { container } = renderWithTheme(
        <ContentCard>
          <p>Just content</p>
        </ContentCard>,
      );
      expect(screen.getByText("Just content")).toBeInTheDocument();
      const headings = container.querySelectorAll("h3");
      expect(headings.length).toBe(0);
    });
  });

  describe("click handling", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      renderWithTheme(
        <ContentCard onClick={handleClick}>
          <p>Clickable content</p>
        </ContentCard>,
      );
      fireEvent.click(screen.getByText("Clickable content"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not be clickable when onClick is not provided", () => {
      const { container } = renderWithTheme(
        <ContentCard>
          <p>Non-clickable content</p>
        </ContentCard>,
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ cursor: "default" });
    });

    it("should have pointer cursor when clickable", () => {
      const handleClick = vi.fn();
      const { container } = renderWithTheme(
        <ContentCard onClick={handleClick}>
          <p>Content</p>
        </ContentCard>,
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ cursor: "pointer" });
    });
  });
});
