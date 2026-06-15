import type { Rank } from "./types";

/* Derive a pilot's rank from total credited hours, using the VA's own ladder.
   A manual rankLabel override always wins. */
export function rankForHours(ranks: Rank[], hours: number): Rank {
  const ladder = ranks.filter((r) => r.hours >= 0).sort((a, b) => a.hours - b.hours);
  let current = ladder[0] || { id: "r0", label: "Pilot", hours: 0, note: "" };
  for (const r of ladder) if (hours >= r.hours) current = r;
  return current;
}

export function nextRank(ranks: Rank[], hours: number): Rank | null {
  const ladder = ranks.filter((r) => r.hours >= 0).sort((a, b) => a.hours - b.hours);
  return ladder.find((r) => r.hours > hours) || null;
}

export function rankProgress(ranks: Rank[], hours: number): number {
  const cur = rankForHours(ranks, hours);
  const nxt = nextRank(ranks, hours);
  if (!nxt) return 100;
  const span = nxt.hours - cur.hours;
  if (span <= 0) return 100;
  return Math.min(100, Math.round(((hours - cur.hours) / span) * 100));
}
