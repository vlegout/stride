import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Box, Button, Alert, CircularProgress } from "@mui/material";

import { uploadActivity } from "../api";
import { AxiosError } from "axios";
import { PageHeader, FormField, SectionContainer } from "../components/ui";

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
      <PageHeader title="Upload Activity" />

      <SectionContainer maxWidth="600px" centered variant="paper" elevation={2}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <FormField
            type="text"
            label="Activity Title"
            value={title}
            onChange={(value) => setTitle(value as string)}
            required
            disabled={uploadMutation.isPending}
            placeholder="Enter activity title"
          />

          <FormField
            type="checkbox"
            label="Race"
            checkboxProps={{
              checked: race,
              onChange: (e) => setRace(e.target.checked),
            }}
            disabled={uploadMutation.isPending}
          />

          <FormField
            type="file"
            label="Select FIT File"
            onChange={(value) => handleFileChange(value as React.ChangeEvent<HTMLInputElement>)}
            disabled={uploadMutation.isPending}
            error={!!error && error.includes("file")}
            fileProps={{
              accept: ".fit",
              ...(fitFile && { fileName: fitFile.name }),
            }}
          />

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
      </SectionContainer>
    </Box>
  );
};

export default Upload;
