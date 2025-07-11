import { describe, it, expect } from "vitest";
import {
  formatSpeed,
  formatDistance,
  formatDuration,
  formatDateTime,
  formatInterval,
  formatPace,
  formatDate,
  isTokenValid,
  processTracePointData,
  hasValidData,
} from "../src/utils";
import type { TracePoint } from "../src/types";

describe("utils", () => {
  describe("formatSpeed", () => {
    it("should format speed with 2 decimal places and km/h unit", () => {
      expect(formatSpeed(25.5)).toBe("25.50 km/h");
      expect(formatSpeed(10.123)).toBe("10.12 km/h");
      expect(formatSpeed(0)).toBe("0.00 km/h");
    });

    it("should return empty string for null speed", () => {
      expect(formatSpeed(null as unknown as number)).toBe("");
    });

    it("should return empty string for undefined speed", () => {
      expect(formatSpeed(undefined as unknown as number)).toBe("");
    });
  });

  describe("formatDistance", () => {
    it("should convert meters to kilometers with 2 decimal places", () => {
      expect(formatDistance(5000)).toBe("5.00 km");
      expect(formatDistance(1500)).toBe("1.50 km");
      expect(formatDistance(999)).toBe("1.00 km");
      expect(formatDistance(500)).toBe("0.50 km");
    });

    it("should handle zero distance", () => {
      expect(formatDistance(0)).toBe("0.00 km");
    });
  });

  describe("formatDuration", () => {
    it("should format duration in human readable format", () => {
      expect(formatDuration(3661)).toBe("1h, 1m, 1s");
      expect(formatDuration(3600)).toBe("1h");
      expect(formatDuration(60)).toBe("1m");
      expect(formatDuration(30)).toBe("30s");
    });

    it("should handle zero duration", () => {
      expect(formatDuration(0)).toBe("—");
    });

    it("should handle null/undefined duration", () => {
      expect(formatDuration(null as unknown as number)).toBe("—");
      expect(formatDuration(undefined as unknown as number)).toBe("—");
    });

    it("should floor fractional seconds", () => {
      expect(formatDuration(60.9)).toBe("1m");
      expect(formatDuration(30.7)).toBe("30s");
    });
  });

  describe("formatDateTime", () => {
    it("should format unix timestamp to readable date with weekday", () => {
      const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
      const result = formatDateTime(timestamp);
      expect(result).toContain("Jan");
      expect(result).toContain("1");
      expect(result).toContain("2021");
    });
  });

  describe("formatInterval", () => {
    it("should format ISO duration to HH:MM:SS format", () => {
      expect(formatInterval("PT1H30M45S")).toBe("01:30:45");
      expect(formatInterval("PT45M30S")).toBe("00:45:30");
      expect(formatInterval("PT30S")).toBe("00:00:30");
      expect(formatInterval("PT2H")).toBe("02:00:00");
    });

    it("should handle zero duration", () => {
      expect(formatInterval("PT0S")).toBe("00:00:00");
    });
  });

  describe("formatPace", () => {
    it("should return '--' for null, undefined, or zero speed", () => {
      expect(formatPace(null as unknown as number, "running")).toBe("--");
      expect(formatPace(undefined as unknown as number, "cycling")).toBe("--");
      expect(formatPace(0, "running")).toBe("--");
    });

    it("should format running pace as min/km", () => {
      // 12 km/h = 5:00 /km
      expect(formatPace(12, "running")).toBe("5:00 /km");
      // 10 km/h = 6:00 /km
      expect(formatPace(10, "running")).toBe("6:00 /km");
      // 15 km/h = 4:00 /km
      expect(formatPace(15, "running")).toBe("4:00 /km");
      // 13.5 km/h = 4:27 /km
      expect(formatPace(13.5, "running")).toBe("4:27 /km");
    });

    it("should format cycling pace as km/h with 1 decimal", () => {
      expect(formatPace(25.123, "cycling")).toBe("25.1 km/h");
      expect(formatPace(30, "cycling")).toBe("30.0 km/h");
    });
  });

  describe("formatDate", () => {
    it("should format a Date object to a readable date with weekday", () => {
      const date = new Date("2021-01-01T00:00:00Z");
      const result = formatDate(date);
      expect(result).toContain("Jan");
      expect(result).toContain("1");
      expect(result).toContain("2021");
    });

    it("should handle different dates", () => {
      const date = new Date("2022-12-25T12:00:00Z");
      const result = formatDate(date);
      expect(result).toContain("Dec");
      expect(result).toContain("25");
      expect(result).toContain("2022");
    });
  });

  describe("isTokenValid", () => {
    it("should return true for a valid token", () => {
      const token = "some_token";
      const tokenExpiry = Date.now() + 3600 * 1000; // 1 hour from now
      expect(isTokenValid(token, tokenExpiry)).toBe(true);
    });

    it("should return false for an expired token", () => {
      const token = "some_token";
      const tokenExpiry = Date.now() - 3600 * 1000; // 1 hour ago
      expect(isTokenValid(token, tokenExpiry)).toBe(false);
    });

    it("should return false for a null token", () => {
      const token = null;
      const tokenExpiry = Date.now() + 3600 * 1000;
      expect(isTokenValid(token, tokenExpiry)).toBe(false);
    });

    it("should return false for a null tokenExpiry", () => {
      const token = "some_token";
      const tokenExpiry = null;
      expect(isTokenValid(token, tokenExpiry)).toBe(false);
    });

    it("should return false for both null", () => {
      const token = null;
      const tokenExpiry = null;
      expect(isTokenValid(token, tokenExpiry)).toBe(false);
    });
  });

  describe("processTracePointData", () => {
    const mockTracePoint: TracePoint = {
      lat: 45.123,
      lng: 2.456,
      timestamp: "2024-01-01T10:00:00Z",
      distance: 5000,
      heart_rate: 150,
      speed: 12.5,
      power: 250,
      altitude: 100,
    };

    it("should process valid trace point data correctly", () => {
      const tracePoints = [mockTracePoint];
      const result = processTracePointData(tracePoints);

      expect(result).toEqual({
        labels: [5.0], // 5000m converted to 5km
        speedData: [12.5],
        hrData: [150],
        altitudeData: [100],
        powerData: [250],
      });
    });

    it("should handle empty array", () => {
      const result = processTracePointData([]);
      expect(result).toEqual({
        labels: [],
        speedData: [],
        hrData: [],
        altitudeData: [],
        powerData: [],
      });
    });

    it("should handle null/undefined input", () => {
      const result = processTracePointData(null as unknown as TracePoint[]);
      expect(result).toEqual({
        labels: [],
        speedData: [],
        hrData: [],
        altitudeData: [],
        powerData: [],
      });
    });

    it("should handle multiple trace points", () => {
      const tracePoints = [
        mockTracePoint,
        {
          ...mockTracePoint,
          distance: 10000,
          speed: 15.0,
          heart_rate: 160,
          altitude: 120,
          power: 280,
        },
      ];
      const result = processTracePointData(tracePoints);

      expect(result).toEqual({
        labels: [5.0, 10.0],
        speedData: [12.5, 15.0],
        hrData: [150, 160],
        altitudeData: [100, 120],
        powerData: [250, 280],
      });
    });

    it("should handle trace points with null/undefined values", () => {
      const tracePointsWithNulls = [
        {
          ...mockTracePoint,
          distance: null as unknown as number,
          speed: undefined as unknown as number,
          heart_rate: null as unknown as number,
          altitude: undefined as unknown as number,
          power: null as unknown as number,
        },
      ];
      const result = processTracePointData(tracePointsWithNulls);

      expect(result).toEqual({
        labels: [0], // null distance becomes 0
        speedData: [0], // undefined speed becomes 0
        hrData: [0], // null heart_rate becomes 0
        altitudeData: [0], // undefined altitude becomes 0
        powerData: [0], // null power becomes 0
      });
    });

    it("should handle mixed valid and invalid data", () => {
      const mixedData = [
        mockTracePoint,
        {
          ...mockTracePoint,
          distance: null as unknown as number,
          speed: 20.0,
          heart_rate: undefined as unknown as number,
          altitude: 150,
          power: null as unknown as number,
        },
      ];
      const result = processTracePointData(mixedData);

      expect(result).toEqual({
        labels: [5.0, 0],
        speedData: [12.5, 20.0],
        hrData: [150, 0],
        altitudeData: [100, 150],
        powerData: [250, 0],
      });
    });
  });

  describe("hasValidData", () => {
    it("should return true for arrays with positive values", () => {
      expect(hasValidData([1, 2, 3])).toBe(true);
      expect(hasValidData([0, 0, 5])).toBe(true);
      expect(hasValidData([10.5, 20.3])).toBe(true);
    });

    it("should return false for empty arrays", () => {
      expect(hasValidData([])).toBe(false);
    });

    it("should return false for arrays with only zero values", () => {
      expect(hasValidData([0, 0, 0])).toBe(false);
    });

    it("should return false for arrays with only null values", () => {
      expect(hasValidData([null, null] as unknown as number[])).toBe(false);
    });

    it("should return false for arrays with only negative values", () => {
      expect(hasValidData([-1, -2, -3])).toBe(false);
    });

    it("should return true for arrays with at least one positive value", () => {
      expect(hasValidData([0, 0, 1])).toBe(true);
      expect(hasValidData([null, 0, 5] as unknown as number[])).toBe(true);
      expect(hasValidData([-1, 0, 3])).toBe(true);
    });

    it("should handle null/undefined input", () => {
      expect(hasValidData(null as unknown as number[])).toBe(false);
      expect(hasValidData(undefined as unknown as number[])).toBe(false);
    });

    it("should handle arrays with mixed null/undefined/number values", () => {
      expect(hasValidData([null, undefined, 0, 5] as unknown as number[])).toBe(true);
      expect(hasValidData([null, undefined, 0] as unknown as number[])).toBe(false);
    });
  });
});
