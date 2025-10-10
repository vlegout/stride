import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Alert, CircularProgress } from "@mui/material";
import { AxiosError } from "axios";

import { updateActivity } from "../api";
import { FormField } from "./ui";
import type { Activity, ActivityUpdate } from "../types";

interface EditActivityModalProps {
  open: boolean;
  onClose: () => void;
  activity: Activity;
}

const EditActivityModal = ({ open, onClose, activity }: EditActivityModalProps) => {
  const [title, setTitle] = useState(activity.title);
  const [race, setRace] = useState(activity.race);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updates: ActivityUpdate) => updateActivity(activity.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activityId", activity.id] });
      onClose();
      setError(null);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      setError(error.response?.data?.detail || "Failed to update activity");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setError(null);

    const updates: ActivityUpdate = {};
    if (title.trim() !== activity.title) {
      updates.title = title.trim();
    }
    if (race !== activity.race) {
      updates.race = race;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    updateMutation.mutate(updates);
  };

  const handleClose = () => {
    if (updateMutation.isPending) return;
    setTitle(activity.title);
    setRace(activity.race);
    setError(null);
    onClose();
  };

  return (
    <Dialog key={activity.id} open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Activity</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <FormField
            type="text"
            label="Activity Title"
            value={title}
            onChange={(value) => setTitle(value as string)}
            required
            disabled={updateMutation.isPending}
            placeholder="Enter activity title"
          />

          <FormField
            type="checkbox"
            label="Race"
            checkboxProps={{
              checked: race,
              onChange: (e) => setRace(e.target.checked),
            }}
            disabled={updateMutation.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={updateMutation.isPending || !title.trim()}>
          {updateMutation.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Updating...
            </>
          ) : (
            "Update Activity"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditActivityModal;
