import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
interface LoadingStateProps {
  message?: string;
  size?: number;
  centered?: boolean;
}

const LoadingState = ({ message = "Loading...", size = 40, centered = true }: LoadingStateProps) => {
  const content = (
    <>
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
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

  return <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>{content}</Box>;
};

export default LoadingState;
