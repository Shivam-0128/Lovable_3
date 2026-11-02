/** Format a Date as YYYY-MM-DD using local time. */
export function formatDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** The last `n` days including today, newest first. */
export function lastDays(n: number, today: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push(formatDay(d));
  }
  return out;
}

function prevDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return formatDay(new Date(y, m - 1, d - 1));
}

/** Consecutive completed days, counting back from the most recent completed day. */
export function currentStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  let cursor = [...set].sort().at(-1)!;
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = prevDay(cursor);
  }
  return streak;
}
