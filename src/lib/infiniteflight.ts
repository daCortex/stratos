/* ----------------------------------------------------------------
   Infinite Flight Live API client.

   Dormant until IF_API_KEY is set — every function degrades gracefully
   (returns null / empty) so the UI works without it and lights up the
   moment the key is configured. Powers identity verification, real-stat
   validation, and the live flight map.
------------------------------------------------------------------- */

const API = "https://api.infiniteflight.com/public/v2";
const KEY = process.env.IF_API_KEY || "";
export const ifConfigured = !!KEY;

async function ifGet<T>(path: string): Promise<T | null> {
  if (!ifConfigured) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${KEY}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.result ?? json) as T;
  } catch {
    return null;
  }
}
async function ifPost<T>(path: string, body: unknown): Promise<T | null> {
  if (!ifConfigured) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.result ?? json) as T;
  } catch {
    return null;
  }
}

export type IfUserStats = {
  userId: string;
  discourseUsername: string | null;
  grade: number;
  flightTimeMinutes: number;
  landingCount: number;
  violations: number;
  xp: number;
};

/* Resolve an IFC (community) username to their real IF stats — proves the
   account exists and gives trustworthy totals to validate against. */
export async function lookupByIfc(ifcUsername: string): Promise<IfUserStats | null> {
  const ifc = ifcUsername.trim();
  if (!ifc) return null;
  const rows = await ifPost<any[]>(`/user/stats`, { discourseNames: [ifc] });
  const u = rows?.[0];
  if (!u) return null;
  return {
    userId: u.userId,
    discourseUsername: u.discourseUsername ?? ifc,
    grade: u.grade ?? 0,
    flightTimeMinutes: u.flightTime ?? 0,
    landingCount: u.landingCount ?? 0,
    violations: u.violations ?? 0,
    xp: u.xp ?? 0,
  };
}

export type LiveFlight = {
  flightId: string;
  userId: string;
  username: string | null;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  aircraftId: string;
  server: string;
};

/* All flights currently airborne across the public servers. */
export async function liveFlights(): Promise<LiveFlight[]> {
  if (!ifConfigured) return [];
  const sessions = await ifGet<any[]>(`/sessions`);
  if (!sessions?.length) return [];
  const out: LiveFlight[] = [];
  for (const s of sessions) {
    const flights = await ifGet<any[]>(`/sessions/${s.id}/flights`);
    for (const f of flights || []) {
      out.push({
        flightId: f.flightId, userId: f.userId, username: f.username ?? null,
        callsign: f.callsign ?? "", latitude: f.latitude, longitude: f.longitude,
        altitude: Math.round(f.altitude ?? 0), speed: Math.round(f.speed ?? 0),
        heading: Math.round(f.heading ?? 0), aircraftId: f.aircraftLiveryId ?? f.aircraftId ?? "",
        server: s.name ?? "",
      });
    }
  }
  return out;
}

export function gradeLabel(grade: number): string {
  return grade >= 1 && grade <= 5 ? `Grade ${grade}` : "Unrated";
}
