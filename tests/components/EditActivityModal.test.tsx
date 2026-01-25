import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import EditActivityModal from "../../src/components/EditActivityModal";
import type { Activity } from "../../src/types";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

const createMockActivity = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    fit: "test.fit",
    title: "Morning Run",
    description: "",
    sport: "running",
    device: "Garmin",
    race: false,
    start_time: 1700000000,
    total_timer_time: 3600,
    total_elapsed_time: 3700,
    total_distance: 10000,
    total_ascent: 100,
    avg_speed: 10,
    avg_heart_rate: 150,
    max_heart_rate: 180,
    avg_cadence: 170,
    max_cadence: 190,
    avg_power: null,
    max_power: null,
    np_power: null,
    total_calories: null,
    total_training_effect: null,
    training_stress_score: null,
    intensity_factor: null,
    avg_temperature: null,
    max_temperature: null,
    min_temperature: null,
    pool_length: null,
    num_lengths: null,
    lat: 48.8566,
    lon: 2.3522,
    delta_lat: 0.01,
    delta_lon: 0.01,
    city: "Paris",
    country: "France",
    laps: [],
    performances: [],
    performance_power: [],
    notifications: [],
    ...overrides,
  }) as Activity;

describe("EditActivityModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    activity: createMockActivity(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.updateActivity).mockResolvedValue({} as Activity);
    vi.mocked(api.deleteActivity).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders dialog when open is true", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    expect(screen.getByText("Edit Activity")).toBeInTheDocument();
  });

  it("displays activity title in input", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    expect(input).toHaveValue("Morning Run");
  });

  it("displays race checkbox with correct initial state", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} activity={createMockActivity({ race: true })} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("shows Delete button", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
  });

  it("shows Cancel button", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows Update Activity button", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /update activity/i })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    renderWithProviders(<EditActivityModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("closes dialog without API call when no changes made", async () => {
    const onClose = vi.fn();
    renderWithProviders(<EditActivityModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    expect(onClose).toHaveBeenCalled();
    expect(api.updateActivity).not.toHaveBeenCalled();
  });

  it("calls updateActivity when title is changed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);
    await user.type(input, "Evening Jog");

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    await waitFor(() => {
      expect(api.updateActivity).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000", { title: "Evening Jog" });
    });
  });

  it("calls updateActivity when race is toggled", async () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    await waitFor(() => {
      expect(api.updateActivity).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000", { race: true });
    });
  });

  it("calls updateActivity with both title and race when both changed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);
    await user.type(input, "Race Day");

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    await waitFor(() => {
      expect(api.updateActivity).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000", {
        title: "Race Day",
        race: true,
      });
    });
  });

  it("disables button when title is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);

    const updateButton = screen.getByRole("button", { name: /update activity/i });
    expect(updateButton).toBeDisabled();
    expect(api.updateActivity).not.toHaveBeenCalled();
  });

  it("disables button when title is whitespace only", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);
    await user.type(input, "   ");

    const updateButton = screen.getByRole("button", { name: /update activity/i });
    expect(updateButton).toBeDisabled();
    expect(api.updateActivity).not.toHaveBeenCalled();
  });

  it("shows Confirm Delete? after clicking Delete", () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
  });

  it("calls deleteActivity when confirming delete", async () => {
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(api.deleteActivity).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000");
    });
  });

  it("displays error message when update fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateActivity).mockRejectedValue({
      response: { data: { detail: "Update failed" } },
    });

    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);
    await user.type(input, "New Title");

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
  });

  it("displays generic error when update fails without detail", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateActivity).mockRejectedValue({
      response: { data: {} },
    });

    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);
    await user.type(input, "New Title");

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to update activity")).toBeInTheDocument();
    });
  });

  it("displays error message when delete fails", async () => {
    vi.mocked(api.deleteActivity).mockRejectedValue({
      response: { data: { detail: "Cannot delete activity" } },
    });

    renderWithProviders(<EditActivityModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.getByText("Cannot delete activity")).toBeInTheDocument();
    });
  });

  it("trims whitespace from title before submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditActivityModal {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /activity title/i });
    await user.clear(input);
    await user.type(input, "  New Title  ");

    fireEvent.click(screen.getByRole("button", { name: /update activity/i }));

    await waitFor(() => {
      expect(api.updateActivity).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000", { title: "New Title" });
    });
  });
});
