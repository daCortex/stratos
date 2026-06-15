import type {
  PlatformUser, Org, Membership, Pirep, NewsPost, Loa, Report, Invite, Role, MemberStatus,
  Route, EventItem, Award, EarnedAward, Notam, Challenge, ChallengeProgress,
  PointsEntry, ShopItem, Redemption, Notification, ApplicationForm, Application,
} from "./types";
import {
  defaultBranding, defaultNav, defaultRanks, defaultMultipliers, defaultHubs, defaultFleet,
  defaultSettings, defaultCodeshares,
} from "./theme";
import { hashSecret } from "./crypto";
import { randomBytes } from "node:crypto";

/* ----------------------------------------------------------------
   Stratos data store.

   Written as an async interface so it can be backed by Neon Postgres
   (when DATABASE_URL is set) without changing any callers. Until then it
   runs on a seeded in-memory store so the whole platform — VA signup,
   branding, roster, PIREPs, join codes — works out of the box.

   The in-memory data is cached on globalThis so Next's dev hot-reload
   doesn't wipe it between requests.
------------------------------------------------------------------- */

export const dbConfigured = !!process.env.DATABASE_URL;

type DB = {
  users: PlatformUser[];
  orgs: Org[];
  members: Membership[];
  pireps: Pirep[];
  news: NewsPost[];
  loas: Loa[];
  reports: Report[];
  invites: Invite[];
  routes: Route[];
  events: EventItem[];
  awards: Award[];
  earned: EarnedAward[];
  notams: Notam[];
  challenges: Challenge[];
  challengeProgress: ChallengeProgress[];
  points: PointsEntry[];
  shop: ShopItem[];
  redemptions: Redemption[];
  notifications: Notification[];
  appForms: ApplicationForm[];
  applications: Application[];
  seq: number;
};

const g = globalThis as unknown as { __stratos?: DB };

function nextId(db: DB): number {
  db.seq += 1;
  return db.seq;
}

function seed(): DB {
  const db: DB = {
    users: [], orgs: [], members: [], pireps: [], news: [], loas: [], reports: [], invites: [],
    routes: [], events: [], awards: [], earned: [], notams: [], challenges: [], challengeProgress: [],
    points: [], shop: [], redemptions: [], notifications: [], appForms: [], applications: [], seq: 0,
  };
  const now = "2026-01-15T00:00:00.000Z";

  // Demo owner — log in with IFC username "demo" and password "demo".
  const owner: PlatformUser = {
    id: nextId(db), ifcUsername: "demo", displayName: "Alex Rivera",
    passwordHash: hashSecret("demo"), avatar: null, createdAt: now,
  };
  db.users.push(owner);

  // A fully-built demo VA so the experience is explorable immediately.
  const org: Org = {
    id: nextId(db), slug: "skyline", name: "Skyline Virtual", callsignPrefix: "SKY",
    ownerUserId: owner.id, joinCode: "SKYLINE", createdAt: now,
    branding: { ...defaultBranding(205), accentHue: 165 },
    nav: defaultNav(), hubs: defaultHubs(), fleet: defaultFleet(),
    ranks: defaultRanks(), multipliers: defaultMultipliers(), settings: defaultSettings("Skyline Virtual"),
    codeshares: [
      { id: "c1", name: "Aurora Atlantic", logoUrl: null },
      { id: "c2", name: "Meridian Air", logoUrl: null },
    ],
  };
  org.settings.tagline = "Connecting the world, one leg at a time.";
  db.orgs.push(org);

  // Owner is also a member (with staff/owner role).
  const ownerMember: Membership = {
    id: nextId(db), orgId: org.id, userId: owner.id, role: "owner", callsign: "SKY001",
    status: "active", rankLabel: null, baseMinutes: 18000, basePireps: 120,
    ifUsername: "demo", joinedAt: now, warnings: [],
  };
  db.members.push(ownerMember);

  // A few sample pilots.
  const sample = [
    ["Jordan Pike", "skypilot1", "SKY014", 9200, 64],
    ["Mina Castellanos", "mina_c", "SKY027", 4100, 31],
    ["Tom Whitfield", "twf", "SKY033", 1500, 12],
  ] as const;
  for (const [name, ifc, cs, mins, preps] of sample) {
    const u: PlatformUser = { id: nextId(db), ifcUsername: ifc, displayName: name, passwordHash: hashSecret("demo"), avatar: null, createdAt: now };
    db.users.push(u);
    db.members.push({
      id: nextId(db), orgId: org.id, userId: u.id, role: "pilot", callsign: cs,
      status: "active", rankLabel: null, baseMinutes: mins, basePireps: preps,
      ifUsername: ifc, joinedAt: now, warnings: [],
    });
  }

  db.pireps.push({
    id: nextId(db), orgId: org.id, membershipId: ownerMember.id, flightNo: "SKY302",
    dep: "EGLL", arr: "LFPG", aircraft: "A320neo", minutes: 75, rawMinutes: 75, multiplier: 1,
    multiplierCode: null, fuelKg: 8200, landingRate: -142, server: "Expert", remarks: "Smooth.",
    status: "approved", filedAt: now, reviewedAt: now, reviewer: "Alex Rivera",
  });
  db.pireps.push({
    id: nextId(db), orgId: org.id, membershipId: db.members[1].id, flightNo: "SKY880",
    dep: "EGLL", arr: "KJFK", aircraft: "B787-9", minutes: 444, rawMinutes: 444, multiplier: 1,
    multiplierCode: null, fuelKg: 64000, landingRate: -98, server: "Expert", remarks: "",
    status: "pending", filedAt: now, reviewedAt: null, reviewer: null,
  });

  db.news.push({
    id: nextId(db), orgId: org.id, title: "Skyline Virtual is now on Stratos",
    body: "We've moved our crew center to a new home. Same family, sharper tools.",
    category: "Announcement", imageUrl: null, author: "Alex Rivera", createdAt: now,
  });

  // Routes (route of the week = featured)
  const routeData: [string, string, string, string, number, boolean][] = [
    ["SKY100", "EGLL", "LFPG", "A320neo", 75, true],
    ["SKY880", "EGLL", "KJFK", "B787-9", 444, false],
    ["SKY204", "EGLL", "OMDB", "B787-9", 420, false],
    ["SKY330", "EGLL", "LEBL", "A320neo", 125, false],
    ["SKY540", "EGLL", "EDDF", "A320neo", 95, false],
  ];
  for (const [fn, d, a, ac, dur, feat] of routeData)
    db.routes.push({ id: nextId(db), orgId: org.id, flightNo: fn, dep: d, arr: a, aircraft: ac, durationMin: dur, featured: feat, notes: null });

  // Event
  db.events.push({
    id: nextId(db), orgId: org.id, title: "Friday Night Transatlantic",
    description: "Mass departure from Heathrow to JFK on the Expert Server. Double points for all attendees.",
    dep: "EGLL", arr: "KJFK", aircraft: "B787-9", server: "Expert",
    startAt: "2026-01-23T20:00:00.000Z", bonusCode: "EVENT", bannerUrl: null, signups: [],
  });

  // Awards
  const awardData: [string, string, string, string, Award["trigger"], number][] = [
    ["First Flight", "Filed your very first PIREP.", "🛫", "#C9A84C", "pireps", 1],
    ["Century Club", "Logged 100 hours with the airline.", "💯", "#4FA3FF", "hours", 100],
    ["Frequent Flyer", "Completed 50 flights.", "✈️", "#7DD8A8", "pireps", 50],
    ["Veteran Aviator", "Reached 1,000 hours.", "🎖️", "#E0556A", "hours", 1000],
  ];
  for (const [n, d, ic, col, tr, th] of awardData)
    db.awards.push({ id: nextId(db), orgId: org.id, name: n, description: d, icon: ic, color: col, trigger: tr, threshold: th });

  // NOTAM
  db.notams.push({
    id: nextId(db), orgId: org.id, title: "New livery rolling out fleet-wide",
    body: "Expect the refreshed Skyline livery on all 787 services from February.",
    severity: "info", createdAt: now, expiresAt: null,
  });

  // Challenge
  db.challenges.push({
    id: nextId(db), orgId: org.id, title: "Long-Haul Legend",
    description: "Fly 5 long-haul sectors this month to earn a bonus.",
    goalType: "pireps", goalValue: 5, routeIcaoPair: null, reward: 500, active: true,
  });

  // Shop
  const shopData: [string, string, number, number, string][] = [
    ["Custom callsign", "Pick a personalised callsign number.", 1000, -1, "🔢"],
    ["Senior Captain fast-track", "Skip ahead one rank tier.", 5000, 5, "⏫"],
    ["Profile spotlight", "Featured on the roster for a week.", 750, -1, "🌟"],
    ["Event aircraft choice", "Choose the aircraft for the next event.", 2000, 1, "🛩️"],
  ];
  for (const [n, d, c, st, ic] of shopData)
    db.shop.push({ id: nextId(db), orgId: org.id, name: n, description: d, cost: c, stock: st, icon: ic });

  // Seed some points for the owner
  db.points.push({ id: nextId(db), orgId: org.id, membershipId: ownerMember.id, delta: 3200, reason: "Carried-over balance", at: now });

  // Default application form
  db.appForms.push({
    orgId: org.id, enabled: true, passScore: 70,
    intro: "Thanks for your interest in Skyline Virtual! Answer a few questions and we'll be in touch.",
    questions: [
      { id: "q1", label: "Why do you want to fly for Skyline?", type: "long", options: [], answer: null, required: true },
      { id: "q2", label: "What is your Infinite Flight grade?", type: "choice", options: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"], answer: null, required: true },
      { id: "q3", label: "On the Expert Server, which clearance must you have before pushback at a controlled gate?", type: "quiz", options: ["Pushback approval", "Takeoff clearance", "None"], answer: "Pushback approval", required: true },
    ],
  });

  return db;
}

function getDB(): DB {
  if (!g.__stratos) g.__stratos = seed();
  // Self-heal: backfill any collections added after this process first seeded,
  // so a hot-reloaded dev server (cached on globalThis) doesn't crash.
  const db = g.__stratos as any;
  for (const k of ["routes", "events", "awards", "earned", "notams", "challenges", "challengeProgress", "points", "shop", "redemptions", "notifications", "appForms", "applications"]) {
    if (!Array.isArray(db[k])) db[k] = [];
  }
  return g.__stratos;
}

/* ---------- Users ---------- */
export async function getUserById(id: number): Promise<PlatformUser | null> {
  return getDB().users.find((u) => u.id === id) || null;
}
export async function getUserByIfc(ifc: string): Promise<PlatformUser | null> {
  const norm = ifc.trim().toLowerCase();
  return getDB().users.find((u) => u.ifcUsername.toLowerCase() === norm) || null;
}
export async function createUser(ifcUsername: string, displayName: string, passwordHash: string | null): Promise<PlatformUser> {
  const db = getDB();
  const u: PlatformUser = {
    id: nextId(db), ifcUsername: ifcUsername.trim(), displayName: displayName.trim() || ifcUsername.trim(),
    passwordHash, avatar: null, createdAt: new Date().toISOString(),
  };
  db.users.push(u);
  return u;
}
export async function updateUser(id: number, patch: Partial<PlatformUser>): Promise<void> {
  const u = getDB().users.find((x) => x.id === id);
  if (u) Object.assign(u, patch);
}

/* ---------- Orgs ---------- */
export async function getOrgBySlug(slug: string): Promise<Org | null> {
  return getDB().orgs.find((o) => o.slug === slug.toLowerCase()) || null;
}
export async function getOrgById(id: number): Promise<Org | null> {
  return getDB().orgs.find((o) => o.id === id) || null;
}
export async function listAllOrgs(): Promise<Org[]> {
  return [...getDB().orgs].sort((a, b) => a.name.localeCompare(b.name));
}
export async function listOrgsForUser(userId: number): Promise<Org[]> {
  const db = getDB();
  const orgIds = new Set(db.members.filter((m) => m.userId === userId).map((m) => m.orgId));
  return db.orgs.filter((o) => orgIds.has(o.id));
}
export async function slugAvailable(slug: string): Promise<boolean> {
  return !(await getOrgBySlug(slug));
}
export async function createOrg(input: {
  slug: string; name: string; callsignPrefix: string; ownerUserId: number; hue?: number;
}): Promise<Org> {
  const db = getDB();
  const org: Org = {
    id: nextId(db), slug: input.slug.toLowerCase(), name: input.name, callsignPrefix: input.callsignPrefix.toUpperCase(),
    ownerUserId: input.ownerUserId, joinCode: input.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || randomCode(6),
    createdAt: new Date().toISOString(),
    branding: defaultBranding(input.hue ?? 215), nav: defaultNav(), hubs: defaultHubs(),
    fleet: defaultFleet(), ranks: defaultRanks(), multipliers: defaultMultipliers(),
    settings: defaultSettings(input.name), codeshares: defaultCodeshares(),
  };
  db.orgs.push(org);
  db.appForms.push({ orgId: org.id, enabled: true, passScore: 70, intro: `Apply to fly for ${input.name}.`, questions: [] });
  // Owner becomes an owner-member.
  db.members.push({
    id: nextId(db), orgId: org.id, userId: input.ownerUserId, role: "owner",
    callsign: `${org.callsignPrefix}001`, status: "active", rankLabel: null,
    baseMinutes: 0, basePireps: 0, ifUsername: (await getUserById(input.ownerUserId))?.ifcUsername ?? null,
    joinedAt: org.createdAt, warnings: [],
  });
  return org;
}
export async function updateOrg(id: number, patch: Partial<Org>): Promise<void> {
  const o = getDB().orgs.find((x) => x.id === id);
  if (o) Object.assign(o, patch);
}

/* ---------- Memberships ---------- */
export async function getMembership(orgId: number, userId: number): Promise<Membership | null> {
  return getDB().members.find((m) => m.orgId === orgId && m.userId === userId) || null;
}
export async function getMembershipById(id: number): Promise<Membership | null> {
  return getDB().members.find((m) => m.id === id) || null;
}
export async function listMembers(orgId: number): Promise<Membership[]> {
  return getDB().members.filter((m) => m.orgId === orgId).sort((a, b) => a.callsign.localeCompare(b.callsign));
}
export async function createMembership(input: {
  orgId: number; userId: number; role?: Role; callsign: string; status?: MemberStatus;
  baseMinutes?: number; basePireps?: number; ifUsername?: string | null; rankLabel?: string | null;
}): Promise<Membership> {
  const db = getDB();
  const m: Membership = {
    id: nextId(db), orgId: input.orgId, userId: input.userId, role: input.role ?? "pilot",
    callsign: input.callsign, status: input.status ?? "active", rankLabel: input.rankLabel ?? null,
    baseMinutes: input.baseMinutes ?? 0, basePireps: input.basePireps ?? 0,
    ifUsername: input.ifUsername ?? null, joinedAt: new Date().toISOString(), warnings: [],
  };
  db.members.push(m);
  return m;
}
export async function updateMembership(id: number, patch: Partial<Membership>): Promise<void> {
  const m = getDB().members.find((x) => x.id === id);
  if (m) Object.assign(m, patch);
}
export async function deleteMembership(id: number): Promise<void> {
  const db = getDB();
  db.members = db.members.filter((m) => m.id !== id);
}

/* Credited stats for a member = carried-over base + approved PIREP minutes. */
export async function memberStats(m: Membership): Promise<{ minutes: number; pireps: number }> {
  const ps = getDB().pireps.filter((p) => p.membershipId === m.id && p.status === "approved");
  const minutes = m.baseMinutes + ps.reduce((s, p) => s + p.minutes, 0);
  return { minutes, pireps: m.basePireps + ps.length };
}

/* ---------- PIREPs ---------- */
export async function listPireps(orgId: number, filter?: { status?: string; membershipId?: number }): Promise<Pirep[]> {
  let rows = getDB().pireps.filter((p) => p.orgId === orgId);
  if (filter?.status) rows = rows.filter((p) => p.status === filter.status);
  if (filter?.membershipId) rows = rows.filter((p) => p.membershipId === filter.membershipId);
  return rows.sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}
export async function createPirep(p: Omit<Pirep, "id" | "status" | "filedAt" | "reviewedAt" | "reviewer">, autoApprove: boolean): Promise<Pirep> {
  const db = getDB();
  const row: Pirep = {
    ...p, id: nextId(db), status: autoApprove ? "approved" : "pending",
    filedAt: new Date().toISOString(), reviewedAt: autoApprove ? new Date().toISOString() : null,
    reviewer: autoApprove ? "auto" : null,
  };
  db.pireps.push(row);
  return row;
}
export async function getPirep(id: number): Promise<Pirep | null> {
  return getDB().pireps.find((p) => p.id === id) || null;
}
export async function updatePirep(id: number, patch: Partial<Pirep>): Promise<void> {
  const p = getDB().pireps.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
}

/* ---------- News ---------- */
export async function listNews(orgId: number): Promise<NewsPost[]> {
  return getDB().news.filter((n) => n.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function createNews(n: Omit<NewsPost, "id" | "createdAt">): Promise<NewsPost> {
  const db = getDB();
  const row: NewsPost = { ...n, id: nextId(db), createdAt: new Date().toISOString() };
  db.news.push(row);
  return row;
}
export async function deleteNews(id: number): Promise<void> {
  const db = getDB();
  db.news = db.news.filter((n) => n.id !== id);
}

/* ---------- LOA ---------- */
export async function listLoas(orgId: number): Promise<Loa[]> {
  return getDB().loas.filter((l) => l.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function createLoa(l: Omit<Loa, "id" | "createdAt" | "status" | "startAt" | "endAt" | "resolver">): Promise<Loa> {
  const db = getDB();
  const row: Loa = { ...l, id: nextId(db), status: "pending", startAt: null, endAt: null, resolver: null, createdAt: new Date().toISOString() };
  db.loas.push(row);
  return row;
}
export async function updateLoa(id: number, patch: Partial<Loa>): Promise<void> {
  const l = getDB().loas.find((x) => x.id === id);
  if (l) Object.assign(l, patch);
}

/* ---------- Reports ---------- */
export async function listReports(orgId: number): Promise<Report[]> {
  return getDB().reports.filter((r) => r.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function createReport(r: Omit<Report, "id" | "createdAt" | "status" | "resolver">): Promise<Report> {
  const db = getDB();
  const row: Report = { ...r, id: nextId(db), status: "open", resolver: null, createdAt: new Date().toISOString() };
  db.reports.push(row);
  return row;
}
export async function updateReport(id: number, patch: Partial<Report>): Promise<void> {
  const r = getDB().reports.find((x) => x.id === id);
  if (r) Object.assign(r, patch);
}

/* ---------- Invites & join codes ---------- */
export function randomCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = randomBytes(len);
  for (let i = 0; i < len; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}
export async function listInvites(orgId: number): Promise<Invite[]> {
  return getDB().invites.filter((i) => i.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function createInvite(input: { orgId: number; kind: "multi" | "single"; ifcUsername?: string | null; createdBy: string }): Promise<Invite> {
  const db = getDB();
  const inv: Invite = {
    id: nextId(db), orgId: input.orgId, code: randomCode(8), kind: input.kind,
    ifcUsername: input.ifcUsername?.trim() || null, createdBy: input.createdBy,
    usedByUserId: null, createdAt: new Date().toISOString(), expiresAt: null,
  };
  db.invites.push(inv);
  return inv;
}
export async function findJoinTarget(code: string): Promise<{ org: Org; invite: Invite | null } | null> {
  const db = getDB();
  const norm = code.trim().toUpperCase();
  // Permanent VA join code?
  const org = db.orgs.find((o) => o.joinCode.toUpperCase() === norm);
  if (org) return { org, invite: null };
  // One-time / targeted invite?
  const inv = db.invites.find((i) => i.code.toUpperCase() === norm);
  if (inv) {
    const o = db.orgs.find((x) => x.id === inv.orgId);
    if (o) return { org: o, invite: inv };
  }
  return null;
}
export async function consumeInvite(inviteId: number, userId: number): Promise<void> {
  const inv = getDB().invites.find((i) => i.id === inviteId);
  if (inv && inv.kind === "single") inv.usedByUserId = userId;
}

/* ---------- Routes ---------- */
export async function listRoutes(orgId: number): Promise<Route[]> {
  return getDB().routes.filter((r) => r.orgId === orgId).sort((a, b) => Number(b.featured) - Number(a.featured) || a.flightNo.localeCompare(b.flightNo));
}
export async function createRoute(r: Omit<Route, "id">): Promise<Route> {
  const db = getDB(); const row = { ...r, id: nextId(db) }; db.routes.push(row); return row;
}
export async function updateRoute(id: number, patch: Partial<Route>): Promise<void> {
  const r = getDB().routes.find((x) => x.id === id); if (r) Object.assign(r, patch);
}
export async function deleteRoute(id: number): Promise<void> {
  const db = getDB(); db.routes = db.routes.filter((r) => r.id !== id);
}

/* ---------- Events ---------- */
export async function listEvents(orgId: number): Promise<EventItem[]> {
  return getDB().events.filter((e) => e.orgId === orgId).sort((a, b) => a.startAt.localeCompare(b.startAt));
}
export async function getEvent(id: number): Promise<EventItem | null> {
  return getDB().events.find((e) => e.id === id) || null;
}
export async function createEvent(e: Omit<EventItem, "id" | "signups">): Promise<EventItem> {
  const db = getDB(); const row = { ...e, id: nextId(db), signups: [] as number[] }; db.events.push(row); return row;
}
export async function deleteEvent(id: number): Promise<void> {
  const db = getDB(); db.events = db.events.filter((e) => e.id !== id);
}
export async function toggleEventSignup(eventId: number, membershipId: number): Promise<void> {
  const e = getDB().events.find((x) => x.id === eventId); if (!e) return;
  e.signups = e.signups.includes(membershipId) ? e.signups.filter((m) => m !== membershipId) : [...e.signups, membershipId];
}

/* ---------- Awards & badges ---------- */
export async function listAwards(orgId: number): Promise<Award[]> {
  return getDB().awards.filter((a) => a.orgId === orgId);
}
export async function createAward(a: Omit<Award, "id">): Promise<Award> {
  const db = getDB(); const row = { ...a, id: nextId(db) }; db.awards.push(row); return row;
}
export async function deleteAward(id: number): Promise<void> {
  const db = getDB(); db.awards = db.awards.filter((a) => a.id !== id); db.earned = db.earned.filter((e) => e.awardId !== id);
}
export async function earnedFor(membershipId: number): Promise<EarnedAward[]> {
  return getDB().earned.filter((e) => e.membershipId === membershipId);
}
export async function grantAward(orgId: number, membershipId: number, awardId: number): Promise<boolean> {
  const db = getDB();
  if (db.earned.some((e) => e.membershipId === membershipId && e.awardId === awardId)) return false;
  db.earned.push({ id: nextId(db), orgId, membershipId, awardId, at: new Date().toISOString() });
  return true;
}

/* ---------- NOTAMs ---------- */
export async function listNotams(orgId: number): Promise<Notam[]> {
  return getDB().notams.filter((n) => n.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function createNotam(n: Omit<Notam, "id" | "createdAt">): Promise<Notam> {
  const db = getDB(); const row = { ...n, id: nextId(db), createdAt: new Date().toISOString() }; db.notams.push(row); return row;
}
export async function deleteNotam(id: number): Promise<void> {
  const db = getDB(); db.notams = db.notams.filter((n) => n.id !== id);
}

/* ---------- Challenges ---------- */
export async function listChallenges(orgId: number): Promise<Challenge[]> {
  return getDB().challenges.filter((c) => c.orgId === orgId);
}
export async function createChallenge(c: Omit<Challenge, "id">): Promise<Challenge> {
  const db = getDB(); const row = { ...c, id: nextId(db) }; db.challenges.push(row); return row;
}
export async function deleteChallenge(id: number): Promise<void> {
  const db = getDB(); db.challenges = db.challenges.filter((c) => c.id !== id);
}
export async function challengeProgressFor(membershipId: number): Promise<ChallengeProgress[]> {
  return getDB().challengeProgress.filter((p) => p.membershipId === membershipId);
}

/* ---------- Points (Frequent Flyer) ---------- */
export async function addPoints(orgId: number, membershipId: number, delta: number, reason: string): Promise<void> {
  const db = getDB();
  db.points.push({ id: nextId(db), orgId, membershipId, delta, reason, at: new Date().toISOString() });
}
export async function pointsBalance(membershipId: number): Promise<number> {
  return getDB().points.filter((p) => p.membershipId === membershipId).reduce((s, p) => s + p.delta, 0);
}
export async function listPoints(membershipId: number): Promise<PointsEntry[]> {
  return getDB().points.filter((p) => p.membershipId === membershipId).sort((a, b) => b.at.localeCompare(a.at));
}

/* ---------- Shop & redemptions ---------- */
export async function listShop(orgId: number): Promise<ShopItem[]> {
  return getDB().shop.filter((s) => s.orgId === orgId);
}
export async function createShopItem(s: Omit<ShopItem, "id">): Promise<ShopItem> {
  const db = getDB(); const row = { ...s, id: nextId(db) }; db.shop.push(row); return row;
}
export async function deleteShopItem(id: number): Promise<void> {
  const db = getDB(); db.shop = db.shop.filter((s) => s.id !== id);
}
export async function listRedemptions(orgId: number): Promise<Redemption[]> {
  return getDB().redemptions.filter((r) => r.orgId === orgId).sort((a, b) => b.at.localeCompare(a.at));
}
export async function redeemItem(orgId: number, membershipId: number, itemId: number): Promise<{ ok: boolean; error?: string }> {
  const db = getDB();
  const item = db.shop.find((s) => s.id === itemId && s.orgId === orgId);
  if (!item) return { ok: false, error: "Item not found" };
  if (item.stock === 0) return { ok: false, error: "Out of stock" };
  const bal = await pointsBalance(membershipId);
  if (bal < item.cost) return { ok: false, error: "Not enough points" };
  if (item.stock > 0) item.stock -= 1;
  await addPoints(orgId, membershipId, -item.cost, `Redeemed: ${item.name}`);
  db.redemptions.push({ id: nextId(db), orgId, membershipId, itemId, cost: item.cost, status: "pending", at: new Date().toISOString() });
  return { ok: true };
}
export async function updateRedemption(id: number, patch: Partial<Redemption>): Promise<void> {
  const r = getDB().redemptions.find((x) => x.id === id); if (r) Object.assign(r, patch);
}

/* ---------- Notifications ---------- */
export async function notify(orgId: number, membershipId: number, text: string, href: string | null = null): Promise<void> {
  const db = getDB();
  db.notifications.push({ id: nextId(db), orgId, membershipId, text, href, read: false, at: new Date().toISOString() });
}
export async function listNotifications(membershipId: number): Promise<Notification[]> {
  return getDB().notifications.filter((n) => n.membershipId === membershipId).sort((a, b) => b.at.localeCompare(a.at));
}
export async function markNotificationsRead(membershipId: number): Promise<void> {
  getDB().notifications.filter((n) => n.membershipId === membershipId).forEach((n) => (n.read = true));
}

/* ---------- Application forms ---------- */
export async function getAppForm(orgId: number): Promise<ApplicationForm> {
  const db = getDB();
  let f = db.appForms.find((a) => a.orgId === orgId);
  if (!f) { f = { orgId, enabled: true, passScore: 70, intro: "Apply to fly with us.", questions: [] }; db.appForms.push(f); }
  return f;
}
export async function saveAppForm(orgId: number, patch: Partial<ApplicationForm>): Promise<void> {
  const f = await getAppForm(orgId); Object.assign(f, patch);
}
export async function listApplications(orgId: number): Promise<Application[]> {
  return getDB().applications.filter((a) => a.orgId === orgId).sort((a, b) => b.at.localeCompare(a.at));
}
export async function createApplication(a: Omit<Application, "id" | "at" | "status">): Promise<Application> {
  const db = getDB();
  const row: Application = { ...a, id: nextId(db), status: "pending", at: new Date().toISOString() };
  db.applications.push(row); return row;
}
export async function updateApplication(id: number, patch: Partial<Application>): Promise<void> {
  const a = getDB().applications.find((x) => x.id === id); if (a) Object.assign(a, patch);
}

/* ---------- Engagement hook: run when a PIREP becomes approved ----------
   Awards Frequent Flyer points, advances challenges and grants milestone badges. */
export async function onPirepApproved(pirep: Pirep): Promise<void> {
  const org = await getOrgById(pirep.orgId);
  const m = await getMembershipById(pirep.membershipId);
  if (!org || !m) return;
  const hours = pirep.minutes / 60;
  const earnedPts = Math.round(hours * org.settings.pointsPerHour + org.settings.pointsPerPirep);
  if (earnedPts > 0) await addPoints(org.id, m.id, earnedPts, `Flight ${pirep.flightNo}`);

  // milestone awards
  const stats = await memberStats(m);
  const totalHours = stats.minutes / 60;
  for (const a of await listAwards(org.id)) {
    let hit = false;
    if (a.trigger === "hours") hit = totalHours >= a.threshold;
    else if (a.trigger === "pireps") hit = stats.pireps >= a.threshold;
    else if (a.trigger === "points") hit = (await pointsBalance(m.id)) >= a.threshold;
    if (hit && (await grantAward(org.id, m.id, a.id))) await notify(org.id, m.id, `You earned the “${a.name}” award ${a.icon}`, "/awards");
  }

  // challenge progress
  const db = getDB();
  for (const c of await listChallenges(org.id)) {
    if (!c.active) continue;
    let prog = db.challengeProgress.find((p) => p.challengeId === c.id && p.membershipId === m.id);
    if (!prog) { prog = { id: nextId(db), orgId: org.id, membershipId: m.id, challengeId: c.id, progress: 0, completedAt: null }; db.challengeProgress.push(prog); }
    if (prog.completedAt) continue;
    if (c.goalType === "pireps") prog.progress += 1;
    else if (c.goalType === "hours") prog.progress += hours;
    else if (c.goalType === "route" && c.routeIcaoPair) {
      const [d, a2] = c.routeIcaoPair.split("-");
      if (pirep.dep === d && pirep.arr === a2) prog.progress += 1;
    }
    if (prog.progress >= c.goalValue) {
      prog.completedAt = new Date().toISOString();
      await addPoints(org.id, m.id, c.reward, `Challenge: ${c.title}`);
      await notify(org.id, m.id, `Challenge complete: ${c.title} (+${c.reward} ${org.settings.currency})`, "/pilot");
    }
  }
}
