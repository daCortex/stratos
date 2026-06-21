import { NextResponse } from "next/server";
import * as b from "@/lib/backend";
import { liveFlights } from "@/lib/infiniteflight";
import { createPirep, onPirepApproved } from "@/lib/store";
import { nearestAirport } from "@/lib/airports";
import type { Org, Membership, FlightTrack } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A flight must climb past this and be tracked at least this long to count.
const MIN_ALT_FT = 6000;
const MIN_MINUTES = 10;
const STALE_HOURS = 8;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.CONTROL_SECRET;
  if (!secret) return true; // unguarded until a secret is configured
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true; // Vercel Cron sends this
  if (req.headers.get("x-cron-secret") === secret) return true;
  const url = new URL(req.url);
  return url.searchParams.get("key") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  const flights = await liveFlights();
  if (!flights.length) {
    return NextResponse.json({ ok: true, note: "No live flights (or IF_API_KEY unset).", airborne: 0 });
  }

  const orgs = (await b.all<Org>("orgs")).filter((o) => (o.callsignPrefix || "").trim());
  const memberCache = new Map<number, Membership[]>();
  const getMembers = async (orgId: number) => {
    if (!memberCache.has(orgId)) memberCache.set(orgId, await b.byOrg<Membership>("members", orgId));
    return memberCache.get(orgId)!;
  };

  const liveIds = new Set(flights.map((f) => f.flightId));
  const tracks = await b.all<FlightTrack>("flightTracks");
  const trackByFlight = new Map(tracks.map((t) => [t.flightId, t]));
  const now = new Date().toISOString();

  const matched: { callsign: string; org: string; pilot: string }[] = [];
  let started = 0;
  let updated = 0;
  const filed: { org: string; flightNo: string; dep: string; arr: string; minutes: number }[] = [];

  // 1) Match airborne flights to a VA callsign + a known pilot; upsert tracks.
  for (const f of flights) {
    const cs = (f.callsign || "").toUpperCase();
    const uname = (f.username || "").toLowerCase();
    if (!cs || !uname) continue;

    const org = orgs.find(
      (o) => cs.startsWith(o.callsignPrefix.toUpperCase()) && cs.length > o.callsignPrefix.length
    );
    if (!org) continue;

    const member = (await getMembers(org.id)).find(
      (m) => (m.ifUsername || "").toLowerCase() === uname && m.status !== "suspended"
    );
    if (!member) continue;

    matched.push({ callsign: f.callsign, org: org.name, pilot: member.callsign });
    if (dry) continue;

    const existing = trackByFlight.get(f.flightId);
    if (existing) {
      await b.patch<FlightTrack>("flightTracks", existing.id, {
        lastSeenAt: now,
        lastLat: f.latitude,
        lastLon: f.longitude,
        maxAltitude: Math.max(existing.maxAltitude, f.altitude),
        ticks: existing.ticks + 1,
      });
      updated++;
    } else {
      const dep = nearestAirport(f.latitude, f.longitude);
      await b.insert<FlightTrack>("flightTracks", {
        id: undefined as unknown as number,
        orgId: org.id,
        membershipId: member.id,
        flightId: f.flightId,
        ifUsername: f.username || "",
        callsign: f.callsign,
        aircraftId: f.aircraftId,
        server: f.server,
        dep: dep?.icao || "----",
        startedAt: now,
        lastSeenAt: now,
        lastLat: f.latitude,
        lastLon: f.longitude,
        maxAltitude: f.altitude,
        ticks: 1,
      });
      started++;
    }
  }

  // 2) Finalize tracks whose flight has left the live feed → auto-file a PIREP.
  for (const t of tracks) {
    const gone = !liveIds.has(t.flightId);
    const ageH = (Date.now() - new Date(t.lastSeenAt).getTime()) / 3.6e6;
    if (!gone && ageH < STALE_HOURS) continue;

    if (dry) continue;

    const minutes = Math.round((new Date(t.lastSeenAt).getTime() - new Date(t.startedAt).getTime()) / 60000);
    const qualifies = gone && minutes >= MIN_MINUTES && t.maxAltitude >= MIN_ALT_FT;

    if (qualifies) {
      const org = orgs.find((o) => o.id === t.orgId);
      const arr = nearestAirport(t.lastLat, t.lastLon);
      const autoApprove = org ? org.settings.pirepRequireReview === false : false;
      const pirep = await createPirep(
        {
          orgId: t.orgId,
          membershipId: t.membershipId,
          flightNo: t.callsign,
          dep: t.dep,
          arr: arr?.icao || "----",
          aircraft: t.aircraftId || "Unknown",
          minutes,
          rawMinutes: minutes,
          multiplier: 1,
          multiplierCode: null,
          fuelKg: null,
          landingRate: null,
          server: t.server,
          remarks: "Auto-captured from Infinite Flight",
        },
        autoApprove
      );
      if (autoApprove) await onPirepApproved(pirep);
      filed.push({ org: org?.name || String(t.orgId), flightNo: t.callsign, dep: pirep.dep, arr: pirep.arr, minutes });
    }
    await b.remove("flightTracks", t.id);
  }

  return NextResponse.json({
    ok: true,
    dry,
    airborne: flights.length,
    matched: matched.length,
    matches: matched.slice(0, 20),
    started,
    updated,
    filed,
    activeTracks: dry ? tracks.length : tracks.length + started - filed.length,
  });
}
