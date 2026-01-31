import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivityNotifications from "../../src/components/ActivityNotifications";
import { formatDuration, getOrdinal, getNotificationMessage } from "../../src/components/activityNotificationUtils";
import type { Notification } from "../../src/types";

describe("ActivityNotifications", () => {
  describe("formatDuration", () => {
    it("should format hours and minutes", () => {
      expect(formatDuration("PT1H30M")).toBe("1hr 30min");
      expect(formatDuration("PT2H")).toBe("2hr");
      expect(formatDuration("PT1H0M")).toBe("1hr");
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration("PT30M45S")).toBe("30min 45s");
      expect(formatDuration("PT5M")).toBe("5min");
      expect(formatDuration("PT10M0S")).toBe("10min");
    });

    it("should format seconds only", () => {
      expect(formatDuration("PT45S")).toBe("45s");
      expect(formatDuration("PT0S")).toBe("0s");
    });

    it("should handle decimal seconds", () => {
      expect(formatDuration("PT30M45.7S")).toBe("30min 46s");
      expect(formatDuration("PT45.4S")).toBe("45s");
    });

    it("should return original string for invalid format", () => {
      expect(formatDuration("invalid")).toBe("invalid");
      expect(formatDuration("")).toBe("");
    });

    it("should handle full format with hours, minutes, and seconds", () => {
      expect(formatDuration("PT1H30M45S")).toBe("1hr 30min");
    });
  });

  describe("getOrdinal", () => {
    it("should return empty string for null or zero", () => {
      expect(getOrdinal(null)).toBe("");
      expect(getOrdinal(0)).toBe("");
    });

    it("should return correct ordinal for 1-10", () => {
      expect(getOrdinal(1)).toBe("1st");
      expect(getOrdinal(2)).toBe("2nd");
      expect(getOrdinal(3)).toBe("3rd");
      expect(getOrdinal(4)).toBe("4th");
      expect(getOrdinal(5)).toBe("5th");
      expect(getOrdinal(6)).toBe("6th");
      expect(getOrdinal(7)).toBe("7th");
      expect(getOrdinal(8)).toBe("8th");
      expect(getOrdinal(9)).toBe("9th");
      expect(getOrdinal(10)).toBe("10th");
    });

    it("should handle special cases 11, 12, 13", () => {
      expect(getOrdinal(11)).toBe("11th");
      expect(getOrdinal(12)).toBe("12th");
      expect(getOrdinal(13)).toBe("13th");
    });

    it("should handle 21, 22, 23", () => {
      expect(getOrdinal(21)).toBe("21st");
      expect(getOrdinal(22)).toBe("22nd");
      expect(getOrdinal(23)).toBe("23rd");
    });

    it("should handle larger numbers", () => {
      expect(getOrdinal(100)).toBe("100th");
      expect(getOrdinal(101)).toBe("101st");
      expect(getOrdinal(111)).toBe("111th");
      expect(getOrdinal(112)).toBe("112th");
      expect(getOrdinal(113)).toBe("113th");
    });
  });

  describe("getNotificationMessage", () => {
    it("should format running personal best (rank 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        activity_id: "12345678-1234-5678-1234-567812345678",
        type: "best_effort_all_time",
        rank: 1,
        distance: 5000,
        duration: "PT20M30S",
        power: null,
        achievement_year: null,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("Personal Best 5km in 20min 30s!");
    });

    it("should format running all-time best (rank > 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5e",
        activity_id: "12345678-1234-5678-1234-567812345679",
        type: "best_effort_all_time",
        rank: 3,
        distance: 10000,
        duration: "PT45M",
        power: null,
        achievement_year: null,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("3rd Best 10km in 45min of All Time!");
    });

    it("should format running yearly best (rank 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5f",
        activity_id: "12345678-1234-5678-1234-56781234567a",
        type: "best_effort_yearly",
        rank: 1,
        distance: 5000,
        duration: "PT19M30S",
        power: null,
        achievement_year: 2024,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("Best 5km in 19min 30s of 2024!");
    });

    it("should format running yearly best (rank > 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c60",
        activity_id: "12345678-1234-5678-1234-56781234567b",
        type: "best_effort_yearly",
        rank: 2,
        distance: 10000,
        duration: "PT42M",
        power: null,
        achievement_year: 2024,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("2nd Best 10km in 42min of 2024!");
    });

    it("should format cycling power personal best (rank 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c61",
        activity_id: "12345678-1234-5678-1234-56781234567c",
        type: "best_effort_all_time",
        rank: 1,
        distance: null,
        duration: "PT20M",
        power: 285.5,
        achievement_year: null,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("Personal Best Power 20min: 286W!");
    });

    it("should format cycling power all-time best (rank > 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c62",
        activity_id: "12345678-1234-5678-1234-56781234567d",
        type: "best_effort_all_time",
        rank: 2,
        distance: null,
        duration: "PT5M",
        power: 350,
        achievement_year: null,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("2nd Best Power 5min of All Time: 350W!");
    });

    it("should format cycling power yearly best (rank 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c63",
        activity_id: "12345678-1234-5678-1234-56781234567e",
        type: "best_effort_yearly",
        rank: 1,
        distance: null,
        duration: "PT1H",
        power: 250,
        achievement_year: 2024,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("Best Power 1hr of 2024: 250W!");
    });

    it("should format cycling power yearly best (rank > 1)", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c64",
        activity_id: "12345678-1234-5678-1234-56781234567f",
        type: "best_effort_yearly",
        rank: 3,
        distance: null,
        duration: "PT20M",
        power: 280,
        achievement_year: 2024,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("3rd Best Power 20min of 2024: 280W!");
    });

    it("should return empty string for unknown notification type", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c65",
        activity_id: "12345678-1234-5678-1234-567812345680",
        type: "unknown_type" as Notification["type"],
        rank: 1,
        distance: null,
        duration: null,
        power: null,
        achievement_year: null,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("");
    });

    it("should default rank to 1 when not provided", () => {
      const notification: Notification = {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c66",
        activity_id: "12345678-1234-5678-1234-567812345681",
        type: "best_effort_all_time",
        rank: null,
        distance: 5000,
        duration: "PT20M",
        power: null,
        achievement_year: null,
        message: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      expect(getNotificationMessage(notification)).toBe("Personal Best 5km in 20min!");
    });
  });

  describe("ActivityNotifications component", () => {
    it("should render null when notifications is empty", () => {
      const { container } = render(<ActivityNotifications notifications={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render null when notifications is undefined", () => {
      const { container } = render(<ActivityNotifications notifications={undefined as unknown as Notification[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render success alert for all-time best", () => {
      const notifications: Notification[] = [
        {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c67",
          activity_id: "12345678-1234-5678-1234-567812345682",
          type: "best_effort_all_time",
          rank: 1,
          distance: 5000,
          duration: "PT20M",
          power: null,
          achievement_year: null,
          message: "",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];
      render(<ActivityNotifications notifications={notifications} />);
      expect(screen.getByText("Personal Best 5km in 20min!")).toBeInTheDocument();
    });

    it("should render info alert for yearly best", () => {
      const notifications: Notification[] = [
        {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c68",
          activity_id: "12345678-1234-5678-1234-567812345683",
          type: "best_effort_yearly",
          rank: 1,
          distance: 5000,
          duration: "PT20M",
          power: null,
          achievement_year: 2024,
          message: "",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];
      render(<ActivityNotifications notifications={notifications} />);
      expect(screen.getByText("Best 5km in 20min of 2024!")).toBeInTheDocument();
    });

    it("should render multiple notifications", () => {
      const notifications: Notification[] = [
        {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c69",
          activity_id: "12345678-1234-5678-1234-567812345684",
          type: "best_effort_all_time",
          rank: 1,
          distance: 21098,
          duration: "PT1H45M",
          power: null,
          achievement_year: null,
          message: "",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c6a",
          activity_id: "12345678-1234-5678-1234-567812345684",
          type: "best_effort_yearly",
          rank: 3,
          distance: 42195,
          duration: "PT3H30M",
          power: null,
          achievement_year: 2023,
          message: "",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];
      render(<ActivityNotifications notifications={notifications} />);
      // Check both messages are rendered (using unique distances)
      expect(screen.getByText("Personal Best 21.098km in 1hr 45min!")).toBeInTheDocument();
      expect(screen.getByText("3rd Best 42.195km in 3hr 30min of 2023!")).toBeInTheDocument();
    });
  });
});
