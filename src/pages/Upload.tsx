import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Box, Button, Alert, CircularProgress } from "@mui/material";
import JSZip from "jszip";

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith(".fit")) {
        setFitFile(file);
        setError(null);
      } else if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file);

        const fitFiles = Object.keys(zipContents.files).filter(
          (name) => name.toLowerCase().endsWith(".fit") && !zipContents.files[name].dir,
        );

        if (fitFiles.length === 0) {
          setError("Zip file must contain at least one .fit file");
          setFitFile(null);
          event.target.value = "";
          return;
        }

        if (fitFiles.length > 1) {
          setError("Zip file must contain only one .fit file");
          setFitFile(null);
          event.target.value = "";
          return;
        }

        const fitFileData = await zipContents.files[fitFiles[0]].async("blob");
        const fitFile = new File([fitFileData], fitFiles[0], { type: "application/octet-stream" });

        setFitFile(fitFile);
        setError(null);
      } else {
        setError("Please select a .fit or .zip file");
        setFitFile(null);
        event.target.value = "";
        return;
      }
    } catch (err) {
      console.error("File processing error:", err);
      setError("Failed to process file. Please ensure it's a valid .fit or .zip file");
      setFitFile(null);
      event.target.value = "";
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
            label="Select FIT File or ZIP Archive"
            onChange={(_, event) => handleFileChange(event as React.ChangeEvent<HTMLInputElement>)}
            disabled={uploadMutation.isPending}
            error={!!error && error.includes("file")}
            fileProps={{
              accept: ".fit,.zip",
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
