import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Login from "../../src/pages/Login";
import { createMockGoogleAuthResponse } from "../mocks/apiMocks";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../../src/store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  authenticateWithGoogle: vi.fn(),
}));

Object.defineProperty(import.meta, "env", {
  value: {
    VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
  },
  writable: true,
});

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../src/store";
import { authenticateWithGoogle } from "../../src/api";

describe("Login", () => {
  const mockNavigate = vi.fn();
  const mockSetAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    (vi.mocked(useAuthStore) as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setAuth: mockSetAuth,
    });

    delete (window as { google?: unknown }).google;
  });

  it("should render login page with welcome message", () => {
    render(<Login />);

    expect(screen.getByText("Welcome to Stride")).toBeInTheDocument();
  });

  it("should render google signin button container", () => {
    render(<Login />);

    const buttonContainer = document.getElementById("google-signin-button");
    expect(buttonContainer).toBeInTheDocument();
  });

  it("should initialize Google Sign-In when google is available", () => {
    const mockInitialize = vi.fn();
    const mockRenderButton = vi.fn();

    (window as { google?: unknown }).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
        },
      },
    };

    render(<Login />);

    expect(mockInitialize).toHaveBeenCalledWith({
      client_id: "test-google-client-id",
      callback: expect.any(Function),
    });

    expect(mockRenderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        theme: "outline",
        size: "large",
        width: "100%",
        text: "signin_with",
      }),
    );
  });

  it("should handle successful Google sign in", async () => {
    const mockAuthResponse = createMockGoogleAuthResponse();
    vi.mocked(authenticateWithGoogle).mockResolvedValue(mockAuthResponse);

    const mockCredential =
      "header." +
      btoa(
        JSON.stringify({
          sub: "google-123",
          given_name: "Test",
          family_name: "User",
          email: "test@example.com",
          picture: "https://example.com/pic.jpg",
        }),
      ) +
      ".signature";

    let googleCallback: ((response: { credential: string }) => void) | null = null;

    const mockInitialize = vi.fn((config: { callback: (response: { credential: string }) => void }) => {
      googleCallback = config.callback;
    });

    (window as { google?: unknown }).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: vi.fn(),
        },
      },
    };

    render(<Login />);

    expect(googleCallback).not.toBeNull();
    if (googleCallback) {
      (googleCallback as (response: { credential: string }) => void)({ credential: mockCredential });
    }

    await waitFor(() => {
      expect(authenticateWithGoogle).toHaveBeenCalledWith({
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        google_id: "google-123",
        google_picture: "https://example.com/pic.jpg",
      });
    });

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(mockAuthResponse.user, mockAuthResponse.token);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should handle Google sign in error", async () => {
    vi.mocked(authenticateWithGoogle).mockRejectedValue(new Error("Auth failed"));

    const mockCredential = "header." + btoa(JSON.stringify({ sub: "google-123", email: "test@example.com" })) + ".sig";

    let googleCallback: ((response: { credential: string }) => void) | null = null;

    const mockInitialize = vi.fn((config: { callback: (response: { credential: string }) => void }) => {
      googleCallback = config.callback;
    });

    (window as { google?: unknown }).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: vi.fn(),
        },
      },
    };

    render(<Login />);

    if (googleCallback) {
      (googleCallback as (response: { credential: string }) => void)({ credential: mockCredential });
    }

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in with Google")).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should show loading state during sign in", async () => {
    vi.mocked(authenticateWithGoogle).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(createMockGoogleAuthResponse()), 100)),
    );

    const mockCredential = "header." + btoa(JSON.stringify({ sub: "google-123", email: "test@example.com" })) + ".sig";

    let googleCallback: ((response: { credential: string }) => void) | null = null;

    const mockInitialize = vi.fn((config: { callback: (response: { credential: string }) => void }) => {
      googleCallback = config.callback;
    });

    (window as { google?: unknown }).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: vi.fn(),
        },
      },
    };

    render(<Login />);

    if (googleCallback) {
      (googleCallback as (response: { credential: string }) => void)({ credential: mockCredential });
    }

    await waitFor(() => {
      expect(screen.getByText("Signing you in...")).toBeInTheDocument();
    });
  });

  it("should listen for googleScriptLoaded event when google is not available", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<Login />);

    expect(addEventListenerSpy).toHaveBeenCalledWith("googleScriptLoaded", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("googleScriptLoaded", expect.any(Function));
  });
});
