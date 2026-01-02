import { Alert, Stack } from "@mui/material";
import { Notification } from "../types";

interface ActivityNotificationsProps {
  notifications: Notification[];
}

const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!match) return duration;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseFloat(match[3] || "0");

  if (hours > 0) return `${hours}hr`;
  if (minutes > 0) return `${minutes}min`;
  return `${Math.round(seconds)}s`;
};

const getOrdinal = (rank: number | null): string => {
  if (!rank) return "";
  const suffixes = ["th", "st", "nd", "rd"];
  const v = rank % 100;
  return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

const getNotificationMessage = (notification: Notification): string => {
  const rank = notification.rank || 1;
  const ordinal = getOrdinal(rank);

  if (notification.duration) {
    const durationLabel = formatDuration(notification.duration);
    const powerLabel = notification.power ? `${Math.round(notification.power)}W` : "";

    if (notification.type === "best_effort_all_time") {
      if (rank === 1) {
        return `Personal Best Power ${durationLabel}: ${powerLabel}!`;
      }
      return `${ordinal} Best Power ${durationLabel} of All Time: ${powerLabel}!`;
    }

    if (notification.type === "best_effort_yearly" && notification.achievement_year) {
      if (rank === 1) {
        return `Best Power ${durationLabel} of ${notification.achievement_year}: ${powerLabel}!`;
      }
      return `${ordinal} Best Power ${durationLabel} of ${notification.achievement_year}: ${powerLabel}!`;
    }
  }

  if (notification.distance) {
    const distanceKm = notification.distance / 1000;
    const distanceLabel = `${distanceKm}km`;

    if (notification.type === "best_effort_all_time") {
      if (rank === 1) {
        return `Personal Best ${distanceLabel}!`;
      }
      return `${ordinal} Best ${distanceLabel} of All Time!`;
    }

    if (notification.type === "best_effort_yearly" && notification.achievement_year) {
      if (rank === 1) {
        return `Best ${distanceLabel} of ${notification.achievement_year}!`;
      }
      return `${ordinal} Best ${distanceLabel} of ${notification.achievement_year}!`;
    }
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
