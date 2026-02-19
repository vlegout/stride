import type { DateRangeOption } from "../components/DateSelector";

export const getDaysFromRange = (range: DateRangeOption): number => {
  switch (range) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "6m":
      return 180;
    case "1y":
      return 365;
    case "2y":
      return 730;
    default:
      return 365;
  }
};

export const getWeeksFromRange = (range: DateRangeOption): number => {
  switch (range) {
    case "30d":
      return 4;
    case "90d":
      return 13;
    case "6m":
      return 26;
    case "1y":
      return 52;
    case "2y":
      return 104;
    default:
      return 52;
  }
};

export const filterDataByDateRange = <T extends { date: string }>(data: T[], range: DateRangeOption): T[] => {
  const days = getDaysFromRange(range);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });
};

export const filterWeeklyDataByDateRange = <T extends { week_start: string }>(
  data: T[],
  range: DateRangeOption,
): T[] => {
  const weeks = getWeeksFromRange(range);
  return data.slice(-weeks);
};

export const getDateRangeLabel = (range: DateRangeOption): string => {
  switch (range) {
    case "30d":
      return "30 Days";
    case "90d":
      return "90 Days";
    case "6m":
      return "6 Months";
    case "1y":
      return "1 Year";
    case "2y":
      return "2 Years";
    default:
      return "1 Year";
  }
};
