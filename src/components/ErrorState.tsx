import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import type { ApiError } from "../api/types";

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
  showDetails?: boolean;
  centered?: boolean;
}

const ErrorState = ({ error, onRetry, showDetails = false, centered = true }: ErrorStateProps) => {
  const content = (
    <>
      <Alert severity="error" sx={{ width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          {error.status === 404 ? "Not Found" : "Error"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
        {showDetails && error.details ? (
          <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
            {(() => {
              if (typeof error.details === "string") {
                return error.details;
              }
              if (typeof error.details === "object" && error.details !== null) {
                return JSON.stringify(error.details, null, 2);
              }
              return String(error.details);
            })()}
          </Typography>
        ) : null}
      </Alert>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 2 }}>
          Try again
        </Button>
      )}
    </>
  );

  if (centered) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
          padding: 3,
        }}
      >
        {content}
      </Box>
    );
  }

  return <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{content}</Box>;
};

export default ErrorState;
