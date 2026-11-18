/**
 * When a streak starts to look expiring (motion spec §2.2 / §2.7).
 *
 * 18:00 is a sane floor: late enough that the day feels spent, early enough
 * that a nudge is still actionable. Readers who chose a late reminder get a
 * later window — four hours after their reminder — but never past 23:00, so
 * the flame does not start breathing at bedtime.
 */

export const DEFAULT_REMINDER_TIME = "08:00";
export const AT_RISK_FLOOR_HOUR = 18;
export const AT_RISK_LATEST_HOUR = 23;

export function parseReminderTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.trim().split(":").map(Number);
  return {
    hour: Math.min(23, Math.max(0, Number.isFinite(h) ? h : 8)),
    minute: Math.min(59, Math.max(0, Number.isFinite(m) ? m : 0)),
  };
}

/** Local time when the streak counts as at risk for today. */
export function getAtRiskMoment(reminderTime: string): {
  hour: number;
  minute: number;
} {
  const { hour, minute } = parseReminderTime(reminderTime);
  const target = hour + 4;
  const atRiskHour = Math.min(AT_RISK_LATEST_HOUR, Math.max(AT_RISK_FLOOR_HOUR, target));
  // A clamped moment lands on the hour; an in-range one keeps the reminder's
  // minute so the nudge arrives at a time the reader recognises.
  return { hour: atRiskHour, minute: atRiskHour === target ? minute : 0 };
}
