import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { getLocalDateKey } from "@/lib/date-keys";

/**
 * The current local date key (`YYYY-MM-DD`), refreshed at midnight and whenever
 * the app returns to the foreground.
 *
 * Daily content derives from `new Date()`. Memoising it on `language` alone
 * froze the home card and the verse insight on yesterday's verse for any app
 * left open overnight — the normal case for a daily-practice app (review
 * finding P0).
 */
export function useTodayKey(): string {
  const [today, setToday] = useState(() => getLocalDateKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnight = () => {
      if (timer) clearTimeout(timer);
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      timer = setTimeout(() => {
        setToday(getLocalDateKey());
        scheduleMidnight();
      }, Math.max(1000, midnight.getTime() - now.getTime()));
    };

    scheduleMidnight();

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      // A backgrounded JS timer may have been throttled; re-check the calendar.
      setToday(getLocalDateKey());
      scheduleMidnight();
    });

    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
