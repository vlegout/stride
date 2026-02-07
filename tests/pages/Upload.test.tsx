import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Upload from "../../src/pages/Upload";
import * as api from "../../src/api";
import type { Activity } from "../../src/types";

vi.mock("../../src/api", () => ({
  uploadActivity: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const mockActivity: Activity = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  fit: "test.fit",
  title: "Test Activity",
  description: "",
  sport: "running",
  device: "Garmin",
  race: false,
  start_time: 1704103200,
  total_timer_time: 3600,
  total_elapsed_time: 3700,
  total_distance: 10000,
  total_ascent: 100,
  avg_speed: 2.78,
  avg_heart_rate: 150,
  max_heart_rate: 180,
  avg_cadence: 85,
  max_cadence: 95,
  avg_power: null,
  max_power: null,
  np_power: null,
  total_calories: 500,
  total_training_effect: 3.5,
  training_stress_score: 75,
  intensity_factor: 0.85,
  avg_temperature: 20,
  max_temperature: 25,
  min_temperature: 15,
  pool_length: null,
  num_lengths: null,
  lat: 48.8566,
  lon: 2.3522,
  delta_lat: 0.01,
  delta_lon: 0.01,
  city: "Paris",
  country: "France",
};

describe("Upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the upload form with page header", () => {
    renderWithProviders(<Upload />);

    expect(screen.getByRole("heading", { name: "Upload Activity" })).toBeInTheDocument();
  });

  it("renders the title input field", () => {
    renderWithProviders(<Upload />);

    expect(screen.getByLabelText(/Activity Title/i)).toBeInTheDocument();
  });

  it("renders the race checkbox", () => {
    renderWithProviders(<Upload />);

    expect(screen.getByLabelText(/Race/i)).toBeInTheDocument();
  });

  it("renders the file input", () => {
    renderWithProviders(<Upload />);

    expect(screen.getByText(/Select FIT File or ZIP Archive/i)).toBeInTheDocument();
  });

  it("renders upload button disabled initially", () => {
    renderWithProviders(<Upload />);

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    expect(uploadButton).toBeDisabled();
  });

  it("shows error when submitting without file", async () => {
    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    expect(uploadButton).toBeDisabled();
  });

  it("shows error when submitting without title", async () => {
    renderWithProviders(<Upload />);

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    expect(uploadButton).toBeDisabled();
  });

  it("enables upload button when file and title are provided", async () => {
    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });
  });

  it("handles successful upload and navigates to activity", async () => {
    vi.mocked(api.uploadActivity).mockResolvedValue(mockActivity);

    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(api.uploadActivity).toHaveBeenCalledWith(file, "Test Run", false);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/activities/${mockActivity.id}`);
    });
  });

  it("handles upload with race checkbox checked", async () => {
    vi.mocked(api.uploadActivity).mockResolvedValue(mockActivity);

    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Race Day" } });

    const raceCheckbox = screen.getByLabelText(/Race/i);
    fireEvent.click(raceCheckbox);

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(api.uploadActivity).toHaveBeenCalledWith(file, "Race Day", true);
    });
  });

  it("shows error alert when upload fails", async () => {
    const error = {
      response: {
        data: {
          detail: "Invalid FIT file format",
        },
      },
    };
    vi.mocked(api.uploadActivity).mockRejectedValue(error);

    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid FIT file format")).toBeInTheDocument();
    });
  });

  it("shows generic error when upload fails without detail", async () => {
    vi.mocked(api.uploadActivity).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to upload activity")).toBeInTheDocument();
    });
  });

  it("shows loading state during upload", async () => {
    let resolveUpload: (value: Activity) => void = () => undefined;
    const uploadPromise = new Promise<Activity>((resolve) => {
      resolveUpload = resolve;
    });
    vi.mocked(api.uploadActivity).mockReturnValue(uploadPromise);

    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Uploading...")).toBeInTheDocument();
    });

    resolveUpload(mockActivity);

    await waitFor(() => {
      expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
    });
  });

  it("disables form fields during upload", async () => {
    let resolveUpload: (value: Activity) => void = () => undefined;
    const uploadPromise = new Promise<Activity>((resolve) => {
      resolveUpload = resolve;
    });
    vi.mocked(api.uploadActivity).mockReturnValue(uploadPromise);

    renderWithProviders(<Upload />);

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Run" } });

    const file = new File(["test"], "test.fit", { type: "application/octet-stream" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Activity/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Activity Title/i)).toBeDisabled();
    });

    resolveUpload(mockActivity);
  });
});
