import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Alert, CircularProgress } from "@mui/material";
import { AxiosError } from "axios";

import { updateActivity, deleteActivity } from "../api";
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const deleteMutation = useMutation({
    mutationFn: () => deleteActivity(activity.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activityId", activity.id] });
      onClose();
      setError(null);
      navigate("/activities");
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      setError(error.response?.data?.detail || "Failed to delete activity");
      setConfirmDelete(false);
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
    const trimmedTitle = title.trim();
    if (trimmedTitle !== activity.title) {
      updates.title = trimmedTitle;
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

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleClose = () => {
    if (updateMutation.isPending || deleteMutation.isPending) return;
    setTitle(activity.title);
    setRace(activity.race);
    setError(null);
    setConfirmDelete(false);
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
            disabled={updateMutation.isPending || deleteMutation.isPending}
            placeholder="Enter activity title"
          />

          <FormField
            type="checkbox"
            label="Race"
            checkboxProps={{
              checked: race,
              onChange: (e) => setRace(e.target.checked),
            }}
            disabled={updateMutation.isPending || deleteMutation.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Button
          onClick={handleDelete}
          color={confirmDelete ? "error" : "inherit"}
          disabled={updateMutation.isPending || deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Deleting...
            </>
          ) : confirmDelete ? (
            "Confirm Delete?"
          ) : (
            "Delete"
          )}
        </Button>
        <Box>
          <Button onClick={handleClose} disabled={updateMutation.isPending || deleteMutation.isPending} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={updateMutation.isPending || deleteMutation.isPending || !title.trim()}
          >
            {updateMutation.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              "Update Activity"
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditActivityModal;
