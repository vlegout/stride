import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDaysFromRange,
  getWeeksFromRange,
  filterDataByDateRange,
  filterWeeklyDataByDateRange,
  getDateRangeLabel,
} from "../src/utils/date";
import type { DateRangeOption } from "../src/components/DateSelector";

describe("date utils", () => {
  beforeEach(() => {
    // Mock the current date to a fixed date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z")); // January 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDaysFromRange", () => {
    it("should return correct number of days for each range option", () => {
      expect(getDaysFromRange("30d")).toBe(30);
      expect(getDaysFromRange("90d")).toBe(90);
      expect(getDaysFromRange("6m")).toBe(180);
      expect(getDaysFromRange("1y")).toBe(365);
      expect(getDaysFromRange("2y")).toBe(730);
    });

    it("should return default value for invalid range", () => {
      expect(getDaysFromRange("invalid" as DateRangeOption)).toBe(365);
    });
  });

  describe("getWeeksFromRange", () => {
    it("should return correct number of weeks for each range option", () => {
      expect(getWeeksFromRange("30d")).toBe(4);
      expect(getWeeksFromRange("90d")).toBe(13);
      expect(getWeeksFromRange("6m")).toBe(26);
      expect(getWeeksFromRange("1y")).toBe(52);
      expect(getWeeksFromRange("2y")).toBe(104);
    });

    it("should return default value for invalid range", () => {
      expect(getWeeksFromRange("invalid" as DateRangeOption)).toBe(52);
    });
  });

  describe("getDateRangeLabel", () => {
    it("should return correct human-readable labels for each range option", () => {
      expect(getDateRangeLabel("30d")).toBe("30 Days");
      expect(getDateRangeLabel("90d")).toBe("90 Days");
      expect(getDateRangeLabel("6m")).toBe("6 Months");
      expect(getDateRangeLabel("1y")).toBe("1 Year");
      expect(getDateRangeLabel("2y")).toBe("2 Years");
    });

    it("should return default label for invalid range", () => {
      expect(getDateRangeLabel("invalid" as DateRangeOption)).toBe("1 Year");
    });
  });

  describe("filterDataByDateRange", () => {
    const mockData = [
      { id: 1, date: "2024-01-14", value: 10 }, // 1 day ago
      { id: 2, date: "2024-01-13", value: 20 }, // 2 days ago
      { id: 3, date: "2024-01-01", value: 30 }, // 14 days ago
      { id: 4, date: "2023-12-15", value: 40 }, // 31 days ago
      { id: 5, date: "2023-11-01", value: 50 }, // 75 days ago
      { id: 6, date: "2023-10-15", value: 60 }, // 92 days ago
      { id: 7, date: "2023-07-01", value: 70 }, // 198 days ago
      { id: 8, date: "2023-01-01", value: 80 }, // 379 days ago
    ];

    it("should filter data for 30 days range", () => {
      const result = filterDataByDateRange(mockData, "30d");
      expect(result).toHaveLength(3);
      expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
    });

    it("should filter data for 90 days range", () => {
      const result = filterDataByDateRange(mockData, "90d");
      expect(result).toHaveLength(5);
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it("should filter data for 6 months range", () => {
      const result = filterDataByDateRange(mockData, "6m");
      expect(result).toHaveLength(6);
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should filter data for 1 year range", () => {
      const result = filterDataByDateRange(mockData, "1y");
      expect(result).toHaveLength(7);
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("should filter data for 2 year range", () => {
      const result = filterDataByDateRange(mockData, "2y");
      expect(result).toHaveLength(8);
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("should handle empty data array", () => {
      const result = filterDataByDateRange([], "30d");
      expect(result).toHaveLength(0);
    });

    it("should handle data with all dates outside range", () => {
      const oldData = [
        { id: 1, date: "2020-01-01", value: 10 },
        { id: 2, date: "2019-01-01", value: 20 },
      ];
      const result = filterDataByDateRange(oldData, "30d");
      expect(result).toHaveLength(0);
    });

    it("should handle data with all dates within range", () => {
      const recentData = [
        { id: 1, date: "2024-01-14", value: 10 },
        { id: 2, date: "2024-01-13", value: 20 },
        { id: 3, date: "2024-01-12", value: 30 },
      ];
      const result = filterDataByDateRange(recentData, "30d");
      expect(result).toHaveLength(3);
    });

    it("should handle invalid date strings gracefully", () => {
      const dataWithInvalidDate = [
        { id: 1, date: "2024-01-14", value: 10 },
        { id: 2, date: "invalid-date", value: 20 },
        { id: 3, date: "2024-01-12", value: 30 },
      ];
      const result = filterDataByDateRange(dataWithInvalidDate, "30d");
      // Invalid date should be filtered out
      expect(result).toHaveLength(2);
      expect(result.map((item) => item.id)).toEqual([1, 3]);
    });

    it("should work with different date formats", () => {
      const dataWithDifferentFormats = [
        { id: 1, date: "2024-01-14T10:00:00Z", value: 10 },
        { id: 2, date: "2024-01-13T15:30:00", value: 20 },
        { id: 3, date: "2024-01-12", value: 30 },
      ];
      const result = filterDataByDateRange(dataWithDifferentFormats, "30d");
      expect(result).toHaveLength(3);
    });
  });

  describe("filterWeeklyDataByDateRange", () => {
    const mockWeeklyData = [
      { id: 1, week_start: "2023-01-01", value: 10 },
      { id: 2, week_start: "2023-01-08", value: 20 },
      { id: 3, week_start: "2023-01-15", value: 30 },
      { id: 4, week_start: "2023-01-22", value: 40 },
      { id: 5, week_start: "2023-01-29", value: 50 },
      { id: 6, week_start: "2023-02-05", value: 60 },
      { id: 7, week_start: "2023-02-12", value: 70 },
      { id: 8, week_start: "2023-02-19", value: 80 },
      { id: 9, week_start: "2023-02-26", value: 90 },
      { id: 10, week_start: "2023-03-05", value: 100 },
    ];

    it("should return last 4 weeks for 30d range", () => {
      const result = filterWeeklyDataByDateRange(mockWeeklyData, "30d");
      expect(result).toHaveLength(4);
      expect(result.map((item) => item.id)).toEqual([7, 8, 9, 10]);
    });

    it("should return last 13 weeks for 90d range", () => {
      const result = filterWeeklyDataByDateRange(mockWeeklyData, "90d");
      expect(result).toHaveLength(10); // Less than 13 available
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should return last 26 weeks for 6m range", () => {
      const result = filterWeeklyDataByDateRange(mockWeeklyData, "6m");
      expect(result).toHaveLength(10); // Less than 26 available
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should return last 52 weeks for 1y range", () => {
      const result = filterWeeklyDataByDateRange(mockWeeklyData, "1y");
      expect(result).toHaveLength(10); // Less than 52 available
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should return last 104 weeks for 2y range", () => {
      const result = filterWeeklyDataByDateRange(mockWeeklyData, "2y");
      expect(result).toHaveLength(10); // Less than 104 available
      expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should handle empty data array", () => {
      const result = filterWeeklyDataByDateRange([], "30d");
      expect(result).toHaveLength(0);
    });

    it("should handle data with fewer items than requested weeks", () => {
      const smallData = [
        { id: 1, week_start: "2023-01-01", value: 10 },
        { id: 2, week_start: "2023-01-08", value: 20 },
      ];
      const result = filterWeeklyDataByDateRange(smallData, "30d");
      expect(result).toHaveLength(2);
      expect(result.map((item) => item.id)).toEqual([1, 2]);
    });

    it("should handle single item data", () => {
      const singleData = [{ id: 1, week_start: "2023-01-01", value: 10 }];
      const result = filterWeeklyDataByDateRange(singleData, "30d");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("should work with large datasets", () => {
      // Create 100 weeks of data
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        week_start: `2023-01-${(i % 28) + 1}`,
        value: (i + 1) * 10,
      }));

      const result30d = filterWeeklyDataByDateRange(largeData, "30d");
      expect(result30d).toHaveLength(4);
      expect(result30d.map((item) => item.id)).toEqual([97, 98, 99, 100]);

      const result1y = filterWeeklyDataByDateRange(largeData, "1y");
      expect(result1y).toHaveLength(52);
      expect(result1y[0].id).toBe(49);
      expect(result1y[51].id).toBe(100);
    });
  });
});
