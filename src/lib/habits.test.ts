import { describe, expect, it } from "vitest";
import { currentStreak, lastDays } from "./habits";

describe("lastDays", () => {
  it("returns 7 dates including today in YYYY-MM-DD", () => {
    const days = lastDays(7, new Date(2026, 9, 20));
    expect(days).toEqual([
      "2026-10-20", "2026-10-19", "2026-10-18", "2026-10-17",
      "2026-10-16", "2026-10-15", "2026-10-14",
    ]);
  });
});

describe("currentStreak", () => {
  it("is 0 with no completions", () => {
    expect(currentStreak([])).toBe(0);
  });
  it("counts back from the most recent done day", () => {
    expect(currentStreak(["2026-10-18", "2026-10-17", "2026-10-15"])).toBe(2);
  });
  it("crosses month boundaries", () => {
    expect(currentStreak(["2026-11-01", "2026-10-31", "2026-10-30"])).toBe(3);
  });
});
