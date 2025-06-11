import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator = ({ message = "Loading..." }: LoadingIndicatorProps) => {
  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px" gap={2}>
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Container>
  );
};

export default LoadingIndicator;
