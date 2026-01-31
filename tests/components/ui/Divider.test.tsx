import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Divider from "../../../src/components/ui/Divider";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("Divider", () => {
  it("should render", () => {
    const { container } = renderWithTheme(<Divider />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
