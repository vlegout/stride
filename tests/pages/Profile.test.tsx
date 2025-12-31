import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Profile from "../../src/pages/Profile";
import { createMockProfile } from "../mocks/apiMocks";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  fetchProfile: vi.fn(),
}));

vi.mock("../../src/utils", () => ({
  formatDistance: vi.fn((distance: number) => `${(distance / 1000).toFixed(2)} km`),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

vi.mock("../../src/components/ZoneTables", () => ({
  default: () => <div data-testid="zone-tables">Zone Tables</div>,
}));

import { useQuery } from "@tanstack/react-query";

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading indicator when pending", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("should show loading indicator when fetching", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isFetching: true,
    } as never);

    render(<Profile />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should show loading indicator when error", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: new Error("Failed to load profile"),
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should render profile statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("Profile Statistics")).toBeInTheDocument();
    expect(screen.getByText("Total Activities")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("should render running statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("Run Total Activities")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("Run Total Distance")).toBeInTheDocument();
    expect(screen.getAllByText("500.00 km").length).toBeGreaterThan(0);
  });

  it("should render cycling statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("Cycling Total Activities")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("Cycling Total Distance")).toBeInTheDocument();
    expect(screen.getByText("1000.00 km")).toBeInTheDocument();
  });

  it("should render swimming statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("Swimming Total Activities")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Swimming Total Distance")).toBeInTheDocument();
    expect(screen.getByText("50.00 km")).toBeInTheDocument();
  });

  it("should render zone tables", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByTestId("zone-tables")).toBeInTheDocument();
  });

  it("should render yearly statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("Yearly Statistics")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("should render yearly running statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("300.00 km")).toBeInTheDocument();
  });

  it("should render yearly cycling statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getAllByText("500.00 km").length).toBeGreaterThan(0);
  });

  it("should render yearly swimming statistics", () => {
    const mockProfile = createMockProfile();

    vi.mocked(useQuery).mockReturnValue({
      data: mockProfile,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Profile />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("25.00 km")).toBeInTheDocument();
  });
});
