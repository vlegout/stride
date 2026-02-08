import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Profile from "../../src/pages/Profile";
import * as api from "../../src/api";
import { useAuthStore } from "../../src/store";
import { createMockProfile, createMockUser } from "../mocks/apiMocks";

vi.mock("../../src/api", () => ({
  fetchProfile: vi.fn(),
}));

vi.mock("../../src/components/ZoneTables", () => ({
  default: () => <div data-testid="zone-tables">ZoneTables</div>,
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
};

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: createMockUser() });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state initially", () => {
    vi.mocked(api.fetchProfile).mockImplementation(() => new Promise(() => undefined));

    renderWithProviders(<Profile />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(api.fetchProfile).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
    });
  });

  it("renders page header", async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Profile Statistics")).toBeInTheDocument();
    });
  });

  it("renders total activities", async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  it("renders all sport stats when all enabled", async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Run Total Activities")).toBeInTheDocument();
      expect(screen.getByText("Run Total Distance")).toBeInTheDocument();
      expect(screen.getByText("Cycling Total Activities")).toBeInTheDocument();
      expect(screen.getByText("Cycling Total Distance")).toBeInTheDocument();
      expect(screen.getByText("Swimming Total Activities")).toBeInTheDocument();
      expect(screen.getByText("Swimming Total Distance")).toBeInTheDocument();
    });
  });

  it("renders yearly statistics section", async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Yearly Statistics")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
    });
  });

  it("renders yearly sport headers when all enabled", async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/Running.*Cycling.*Swimming/)).toBeInTheDocument();
    });
  });

  it("renders zone tables", async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByTestId("zone-tables")).toBeInTheDocument();
    });
  });

  it("hides running stats when running disabled", async () => {
    useAuthStore.setState({ user: { ...createMockUser(), running_enabled: false } });
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
    });

    expect(screen.queryByText("Run Total Activities")).not.toBeInTheDocument();
    expect(screen.queryByText("Run Total Distance")).not.toBeInTheDocument();
    expect(screen.getByText("Cycling Total Activities")).toBeInTheDocument();
    expect(screen.getByText("Swimming Total Activities")).toBeInTheDocument();
  });

  it("hides cycling stats when cycling disabled", async () => {
    useAuthStore.setState({ user: { ...createMockUser(), cycling_enabled: false } });
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
    });

    expect(screen.getByText("Run Total Activities")).toBeInTheDocument();
    expect(screen.queryByText("Cycling Total Activities")).not.toBeInTheDocument();
    expect(screen.queryByText("Cycling Total Distance")).not.toBeInTheDocument();
    expect(screen.getByText("Swimming Total Activities")).toBeInTheDocument();
  });

  it("hides swimming stats when swimming disabled", async () => {
    useAuthStore.setState({ user: { ...createMockUser(), swimming_enabled: false } });
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
    });

    expect(screen.getByText("Run Total Activities")).toBeInTheDocument();
    expect(screen.getByText("Cycling Total Activities")).toBeInTheDocument();
    expect(screen.queryByText("Swimming Total Activities")).not.toBeInTheDocument();
    expect(screen.queryByText("Swimming Total Distance")).not.toBeInTheDocument();
  });

  it("hides running from yearly header when disabled", async () => {
    useAuthStore.setState({ user: { ...createMockUser(), running_enabled: false } });
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/Cycling.*Swimming/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Running.*Cycling/)).not.toBeInTheDocument();
  });

  it("hides multiple sports when disabled", async () => {
    useAuthStore.setState({
      user: { ...createMockUser(), running_enabled: false, swimming_enabled: false },
    });
    vi.mocked(api.fetchProfile).mockResolvedValue(createMockProfile());

    renderWithProviders(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
    });

    expect(screen.queryByText("Run Total Activities")).not.toBeInTheDocument();
    expect(screen.getByText("Cycling Total Activities")).toBeInTheDocument();
    expect(screen.queryByText("Swimming Total Activities")).not.toBeInTheDocument();
  });
});
