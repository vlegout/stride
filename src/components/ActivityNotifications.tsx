import { Alert, Stack } from "@mui/material";
import type { Notification } from "../types";
import { getNotificationMessage } from "./activityNotificationUtils";

interface ActivityNotificationsProps {
  notifications: Notification[];
}

const ActivityNotifications = ({ notifications }: ActivityNotificationsProps) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          severity={notification.type === "best_effort_all_time" ? "success" : "info"}
          sx={{ fontWeight: 600 }}
        >
          {getNotificationMessage(notification)}
        </Alert>
      ))}
    </Stack>
  );
};

export default ActivityNotifications;
