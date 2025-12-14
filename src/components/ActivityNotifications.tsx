import { Alert, Stack } from "@mui/material";
import { Notification } from "../types";

interface ActivityNotificationsProps {
  notifications: Notification[];
}

const getNotificationMessage = (notification: Notification): string => {
  const distanceKm = notification.distance / 1000;
  const distanceLabel = `${distanceKm}km`;

  if (notification.type === "best_effort_all_time") {
    return `Personal Best ${distanceLabel}!`;
  }

  if (notification.type === "best_effort_yearly" && notification.achievement_year) {
    return `Best ${distanceLabel} of ${notification.achievement_year}!`;
  }

  return "";
};

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
