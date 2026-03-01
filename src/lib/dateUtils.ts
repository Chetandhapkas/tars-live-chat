import { format, isToday, isThisYear } from "date-fns";

export function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isThisYear(date)) {
    return format(date, "MMM d, h:mm a");
  }
  return format(date, "MMM d, yyyy, h:mm a");
}
