import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";

import { uploadActivity } from "../api";
import { AxiosError } from "axios";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const Upload = () => {
  const [title, setTitle] = useState("");
  const [race, setRace] = useState(false);
  const [fitFile, setFitFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: ({ file, title, race }: { file: File; title: string; race: boolean }) =>
      uploadActivity(file, title, race),
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      navigate(`/activities/${activity.id}`);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      setError(error.response?.data?.detail || "Failed to upload activity");
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".fit")) {
        setError("Please select a .fit file");
        setFitFile(null);
        return;
      }
      setFitFile(file);
      setError(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!fitFile) {
      setError("Please select a FIT file");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setError(null);
    uploadMutation.mutate({ file: fitFile, title: title.trim(), race });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ maxWidth: "600px", mx: "auto" }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Upload Activity
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Activity Title"
              variant="outlined"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploadMutation.isPending}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={race}
                  onChange={(e) => setRace(e.target.checked)}
                  disabled={uploadMutation.isPending}
                />
              }
              label="Race"
            />

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 1 }}
                disabled={uploadMutation.isPending}
              >
                Select FIT File
                <VisuallyHiddenInput type="file" accept=".fit" onChange={handleFileChange} />
              </Button>

              {fitFile && (
                <Typography variant="body2" color="text.secondary">
                  Selected: {fitFile.name}
                </Typography>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={uploadMutation.isPending || !fitFile || !title.trim()}
              sx={{ alignSelf: "flex-start" }}
            >
              {uploadMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Uploading...
                </>
              ) : (
                "Upload Activity"
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Upload;
