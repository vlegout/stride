import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Upload from "../../src/pages/Upload";
import { createMockActivity } from "../mocks/apiMocks";
import { AxiosError } from "axios";

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  uploadActivity: vi.fn(),
}));

const mockLoadAsync = vi.fn();

vi.mock("jszip", () => {
  return {
    default: class MockJSZip {
      loadAsync = mockLoadAsync;
    },
  };
});

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

describe("Upload", () => {
  const mockNavigate = vi.fn();
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as never);
  });

  it("should render upload form", () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    expect(screen.getByRole("heading", { name: "Upload Activity" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter activity title")).toBeInTheDocument();
    expect(screen.getByLabelText("Race")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select FIT File or ZIP Archive" })).toBeInTheDocument();
  });

  it("should enable submit button when title and file are provided", async () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const titleInput = screen.getByPlaceholderText("Enter activity title");
    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const submitButton = screen.getByRole("button", { name: /upload activity/i });

    expect(submitButton).toBeDisabled();

    await userEvent.type(titleInput, "Morning Run");

    const file = new File(["fit content"], "activity.fit", { type: "application/octet-stream" });
    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("should handle .fit file upload", async () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const file = new File(["fit content"], "activity.fit", { type: "application/octet-stream" });

    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should handle successful upload", async () => {
    const mockActivity = createMockActivity();
    const mockMutate = vi.fn();

    vi.mocked(useMutation).mockImplementation((options) => {
      return {
        mutate: (variables: unknown) => {
          mockMutate(variables);
          options.onSuccess?.(mockActivity, variables, undefined, {
            client: mockQueryClient as never,
            meta: undefined,
          });
        },
        isPending: false,
        isError: false,
        error: null,
      } as never;
    });

    render(<Upload />);

    const titleInput = screen.getByPlaceholderText("Enter activity title");
    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const submitButton = screen.getByRole("button", { name: /upload activity/i });

    await userEvent.type(titleInput, "Morning Run");

    const file = new File(["fit content"], "activity.fit", { type: "application/octet-stream" });
    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await userEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Morning Run",
        race: false,
      }),
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["activities"] });
    expect(mockNavigate).toHaveBeenCalledWith(`/activities/${mockActivity.id}`);
  });

  it("should handle upload error", async () => {
    const mockError = new AxiosError("Upload failed", "500", undefined, undefined, {
      data: { detail: "Server error occurred" },
      status: 500,
      statusText: "Internal Server Error",
      headers: {},
      config: {} as never,
    });

    vi.mocked(useMutation).mockImplementation((options) => {
      return {
        mutate: () => {
          options.onError?.(mockError, undefined, undefined, { client: mockQueryClient as never, meta: undefined });
        },
        isPending: false,
        isError: false,
        error: null,
      } as never;
    });

    render(<Upload />);

    const titleInput = screen.getByPlaceholderText("Enter activity title");
    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const submitButton = screen.getByRole("button", { name: /upload activity/i });

    await userEvent.type(titleInput, "Morning Run");

    const file = new File(["fit content"], "activity.fit", { type: "application/octet-stream" });
    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error occurred")).toBeInTheDocument();
    });
  });

  it("should handle race checkbox", async () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const raceCheckbox = screen.getByLabelText("Race");
    expect(raceCheckbox).not.toBeChecked();

    await userEvent.click(raceCheckbox);
    expect(raceCheckbox).toBeChecked();
  });

  it("should show error when submitting without file", async () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const titleInput = screen.getByPlaceholderText("Enter activity title");
    await userEvent.type(titleInput, "Morning Run");

    const form = screen.getByRole("button", { name: /upload activity/i }).closest("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }

    await waitFor(() => {
      expect(screen.getByText("Please select a FIT file")).toBeInTheDocument();
    });
  });

  it("should show error when submitting without title", async () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const file = new File(["fit content"], "activity.fit", { type: "application/octet-stream" });
    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }

    const form = screen.getByRole("button", { name: /upload activity/i }).closest("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }

    await waitFor(() => {
      expect(screen.getByText("Please enter a title")).toBeInTheDocument();
    });
  });

  it("should disable form during upload", () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const titleInput = screen.getByPlaceholderText("Enter activity title");
    const raceCheckbox = screen.getByLabelText("Race");
    const submitButton = screen.getByRole("button", { name: /uploading/i });

    expect(titleInput).toBeDisabled();
    expect(raceCheckbox).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("should handle zip file with single .fit file", async () => {
    mockLoadAsync.mockResolvedValue({
      files: {
        "activity.fit": {
          dir: false,
          async: vi.fn().mockResolvedValue(new Blob(["fit content"])),
        },
      },
    });

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const zipFile = new File(["zip content"], "activities.zip", { type: "application/zip" });

    if (fileInput) {
      await userEvent.upload(fileInput, zipFile);
    }

    await waitFor(() => {
      expect(mockLoadAsync).toHaveBeenCalled();
    });
  });

  it("should show error for zip with multiple .fit files", async () => {
    mockLoadAsync.mockResolvedValue({
      files: {
        "activity1.fit": { dir: false },
        "activity2.fit": { dir: false },
      },
    });

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const zipFile = new File(["zip content"], "activities.zip", { type: "application/zip" });

    if (fileInput) {
      await userEvent.upload(fileInput, zipFile);
    }

    await waitFor(() => {
      expect(screen.getByText("Zip file must contain only one .fit file")).toBeInTheDocument();
    });
  });

  it("should show error for zip with no .fit files", async () => {
    mockLoadAsync.mockResolvedValue({
      files: {
        "readme.txt": { dir: false },
      },
    });

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<Upload />);

    const fileButton = screen.getByRole("button", { name: "Select FIT File or ZIP Archive" });
    const fileInput = fileButton.querySelector("input[type='file']") as HTMLInputElement | null;
    const zipFile = new File(["zip content"], "activities.zip", { type: "application/zip" });

    if (fileInput) {
      await userEvent.upload(fileInput, zipFile);
    }

    await waitFor(() => {
      expect(screen.getByText("Zip file must contain at least one .fit file")).toBeInTheDocument();
    });
  });
});
