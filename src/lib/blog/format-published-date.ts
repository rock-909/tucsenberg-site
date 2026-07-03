import type { Locale } from "@/config/paths/types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatBlogPublishedDate(
  isoDate: string,
  _locale: Locale,
): string {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split("-").map(Number);

  if (!year || !month || !day) {
    return isoDate;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidCalendarDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day;

  if (!isValidCalendarDate) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
