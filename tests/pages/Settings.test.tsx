import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "../../src/pages/Settings";
import { createMockUser } from "../mocks/apiMocks";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  fetchCurrentUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../../src/store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../src/store";

describe("Settings", () => {
  const mockSetUser = vi.fn();
  const mockQueryClient = {
    setQueryData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      setUser: mockSetUser,
    });
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as never);
  });

  it("should show loading indicator when pending", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never);

    render(<Settings />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading settings...")).toBeInTheDocument();
  });

  it("should show loading indicator when fetching", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isFetching: true,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never);

    render(<Settings />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should show loading indicator when error", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: new Error("Failed to load"),
      isPending: false,
      isFetching: false,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never);

    render(<Settings />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should render user information", () => {
    const mockUser = createMockUser();

    vi.mocked(useQuery).mockReturnValue({
      data: mockUser,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never);

    render(<Settings />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("should render map provider select with current value", () => {
    const mockUser = createMockUser();

    vi.mocked(useQuery).mockReturnValue({
      data: mockUser,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never);

    render(<Settings />);

    const select = screen.getByRole("combobox", { name: "Map Provider" });
    expect(select).toHaveTextContent("Leaflet");
  });

  it("should call updateUser mutation when map provider is changed", async () => {
    const mockUser = createMockUser();
    const mockMutate = vi.fn();

    vi.mocked(useQuery).mockReturnValue({
      data: mockUser,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as never);

    render(<Settings />);

    const select = screen.getByRole("combobox", { name: "Map Provider" });
    await userEvent.click(select);

    const mapboxOption = screen.getByRole("option", { name: "Mapbox" });
    await userEvent.click(mapboxOption);

    expect(mockMutate).toHaveBeenCalledWith({ map: "mapbox" });
  });

  it("should disable select during mutation", () => {
    const mockUser = createMockUser();

    vi.mocked(useQuery).mockReturnValue({
      data: mockUser,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as never);

    render(<Settings />);

    const select = screen.getByRole("combobox", { name: "Map Provider" });
    expect(select).toHaveAttribute("aria-disabled", "true");
  });

  it("should update query cache and auth store on successful mutation", () => {
    const mockUser = createMockUser();
    const updatedUser = { ...mockUser, map: "mapbox" as const };
    let onSuccessCallback: ((user: typeof updatedUser) => void) | null = null;

    vi.mocked(useQuery).mockReturnValue({
      data: mockUser,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    (vi.mocked(useMutation) as ReturnType<typeof vi.fn>).mockImplementation(
      (options: { onSuccess?: (user: typeof updatedUser) => void }) => {
        onSuccessCallback = options.onSuccess || null;
        return {
          mutate: vi.fn(),
          isPending: false,
        } as never;
      },
    );

    render(<Settings />);

    expect(onSuccessCallback).not.toBeNull();
    if (onSuccessCallback) {
      (onSuccessCallback as (user: typeof updatedUser) => void)(updatedUser);
    }

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(["currentUser"], updatedUser);
    expect(mockSetUser).toHaveBeenCalledWith(updatedUser);
  });
});
