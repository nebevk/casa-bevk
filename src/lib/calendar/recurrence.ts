export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  recurrence_freq: string;
  recurrence_interval: number;
  recurrence_until: string | null;
  color: string | null;
};

export type Occurrence = { event: CalendarEvent; start: Date; end: Date };

/**
 * Expand events (incl. simple recurrence: daily/weekly/monthly/yearly + interval
 * and optional `until`) into concrete occurrences overlapping [rangeStart, rangeEnd].
 * Pure + client-safe. Times are interpreted in the local timezone.
 */
export function expandEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): Occurrence[] {
  const out: Occurrence[] = [];

  for (const ev of events) {
    const start = new Date(ev.starts_at);
    if (Number.isNaN(start.getTime())) continue;
    const duration = ev.ends_at
      ? Math.max(0, new Date(ev.ends_at).getTime() - start.getTime())
      : 0;
    const freq = ev.recurrence_freq || "none";

    if (freq === "none") {
      const end = new Date(start.getTime() + duration);
      if (end >= rangeStart && start <= rangeEnd) out.push({ event: ev, start, end });
      continue;
    }

    const interval = Math.max(1, ev.recurrence_interval || 1);
    const until = ev.recurrence_until ? new Date(ev.recurrence_until) : null;
    const cur = new Date(start);

    // Fast-forward close to the visible range so long-running series stay cheap.
    if ((freq === "daily" || freq === "weekly") && cur < rangeStart) {
      const unitDays = (freq === "daily" ? 1 : 7) * interval;
      const skip = Math.floor(
        (rangeStart.getTime() - cur.getTime()) / (unitDays * 86_400_000),
      );
      if (skip > 0) cur.setDate(cur.getDate() + skip * unitDays);
    } else if ((freq === "monthly" || freq === "yearly") && cur < rangeStart) {
      const monthsPer = freq === "yearly" ? 12 * interval : interval;
      const monthDiff =
        (rangeStart.getFullYear() - cur.getFullYear()) * 12 +
        (rangeStart.getMonth() - cur.getMonth());
      const skip = Math.floor(monthDiff / monthsPer);
      if (skip > 0) cur.setMonth(cur.getMonth() + skip * monthsPer);
    }

    let guard = 0;
    while (guard++ < 800) {
      if (until && cur > until) break;
      if (cur > rangeEnd) break;
      const end = new Date(cur.getTime() + duration);
      if (end >= rangeStart && cur <= rangeEnd) {
        out.push({ event: ev, start: new Date(cur), end });
      }
      if (freq === "daily") cur.setDate(cur.getDate() + interval);
      else if (freq === "weekly") cur.setDate(cur.getDate() + 7 * interval);
      else if (freq === "monthly") cur.setMonth(cur.getMonth() + interval);
      else if (freq === "yearly") cur.setFullYear(cur.getFullYear() + interval);
      else break;
    }
  }

  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}
