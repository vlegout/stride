import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Alert } from "@mui/material";
import { useAuthStore } from "../store";
import { authenticateWithGoogle } from "../api";
import type { UserCreate } from "../types";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleRenderButtonOptions {
  theme: string;
  size: string;
  width: string;
  text: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement | null, options: GoogleRenderButtonOptions) => void;
  };
}

declare global {
  interface Window {
    google: {
      accounts: GoogleAccounts;
    };
  }
}

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleSignIn = useCallback(
    async (response: GoogleCredentialResponse) => {
      try {
        setLoading(true);
        setError("");

        // Decode the JWT token to get user info
        const payload = JSON.parse(atob(response.credential.split(".")[1]));

        const userData: UserCreate = {
          first_name: payload.given_name || "",
          last_name: payload.family_name || "",
          email: payload.email,
          google_id: payload.sub,
          google_picture: payload.picture,
        };

        // Authenticate with backend and get JWT token
        const authResponse = await authenticateWithGoogle(userData);

        // Set user and token in auth store
        setAuth(authResponse.user, authResponse.token);

        navigate("/");
      } catch (error) {
        console.error("Google Sign-In error:", error);
        setError("Failed to sign in with Google");
      } finally {
        setLoading(false);
      }
    },
    [setAuth, navigate],
  );

  const initializeGoogleSignIn = useCallback(() => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id",
      callback: handleGoogleSignIn,
    });

    window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "signin_with",
    });
  }, [handleGoogleSignIn]);

  useEffect(() => {
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google script to load using onload callback
      const handleGoogleScriptLoad = () => {
        if (window.google) {
          initializeGoogleSignIn();
        }
      };

      window.addEventListener("googleScriptLoaded", handleGoogleScriptLoad);

      // Cleanup listener
      return () => {
        window.removeEventListener("googleScriptLoaded", handleGoogleScriptLoad);
      };
    }
  }, [initializeGoogleSignIn]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to Sport
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <div id="google-signin-button" style={{ width: "100%" }}></div>
        </Box>

        {loading && (
          <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
            Signing you in...
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
