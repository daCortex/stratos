import type {
  PlatformUser, Org, Membership, Pirep, NewsPost, Loa, Report, Invite, Role, MemberStatus,
  Route, EventItem, Award, EarnedAward, Notam, Challenge, ChallengeProgress,
  PointsEntry, ShopItem, Redemption, Notification, ApplicationForm, Application,
} from "./types";
import {
  defaultBranding, defaultNav, defaultRanks, defaultMultipliers, defaultHubs, defaultFleet,
  defaultSettings, defaultCodeshares,
} from "./theme";
import { randomBytes } from "node:crypto";
import * as b from "./backend";

/* ----------------------------------------------------------------
   Stratos data store — business logic over the backend abstraction
   (in-memory locally, Neon Postgres when DATABASE_URL is set). All
   functions are async and backend-agnostic; see backend.ts / seed.ts.
------------------------------------------------------------------- */

export const dbConfigured = b.dbConfigured;

/* ---------- Users ---------- */
export async function getUserById(id: number): Promise<PlatformUser | null> {
  return b.byId<PlatformUser>("users", id);
}
export async function getUserByIfc(ifc: string): Promise<PlatformUser | null> {
  const norm = ifc.trim().toLowerCase();
  return (await b.all<PlatformUser>("users")).find((u) => u.ifcUsername.toLowerCase() === norm) || null;
}
export async function createUser(ifcUsername: string, displayName: string, passwordHash: string | null): Promise<PlatformUser> {
  return b.insert<PlatformUser>("users", {
    id: undefined as unknown as number, ifcUsername: ifcUsername.trim(),
    displayName: displayName.trim() || ifcUsername.trim(), passwordHash, avatar: null, createdAt: new Date().toISOString(),
  });
}
export async function updateUser(id: number, patch: Partial<PlatformUser>): Promise<void> {
  await b.patch("users", id, patch);
}

/* ---------- Orgs ---------- */
export async function getOrgBySlug(slug: string): Promise<Org | null> {
  return (await b.byKey<Org>("orgs", "slug", slug.toLowerCase()))[0] || null;
}
export async function getOrgById(id: number): Promise<Org | null> {
  return b.byId<Org>("orgs", id);
}
export async function listAllOrgs(): Promise<Org[]> {
  return (await b.all<Org>("orgs")).sort((a, c) => a.name.localeCompare(c.name));
}
export async function listOrgsForUser(userId: number): Promise<Org[]> {
  const mine = await b.byKey<Membership>("members", "userId", userId);
  const orgs = await Promise.all([...new Set(mine.map((m) => m.orgId))].map((id) => b.byId<Org>("orgs", id)));
  return orgs.filter((o): o is Org => !!o);
}
export async function slugAvailable(slug: string): Promise<boolean> {
  return !(await getOrgBySlug(slug));
}
export async function createOrg(input: {
  slug: string; name: string; callsignPrefix: string; ownerUserId: number; hue?: number;
}): Promise<Org> {
  const org = await b.insert<Org>("orgs", {
    id: undefined as unknown as number, slug: input.slug.toLowerCase(), name: input.name,
    callsignPrefix: input.callsignPrefix.toUpperCase(), ownerUserId: input.ownerUserId,
    joinCode: input.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || randomCode(6),
    createdAt: new Date().toISOString(),
    branding: defaultBranding(input.hue ?? 215), nav: defaultNav(), hubs: defaultHubs(),
    fleet: defaultFleet(), ranks: defaultRanks(), multipliers: defaultMultipliers(),
    settings: defaultSettings(input.name), codeshares: defaultCodeshares(),
  });
  await b.upsertAppForm({ orgId: org.id, enabled: true, passScore: 70, intro: `Apply to fly for ${input.name}.`, questions: [] });
  const owner = await getUserById(input.ownerUserId);
  await b.insert<Membership>("members", {
    id: undefined as unknown as number, orgId: org.id, userId: input.ownerUserId, role: "owner",
    callsign: `${org.callsignPrefix}001`, status: "active", rankLabel: null, baseMinutes: 0, basePireps: 0,
    ifUsername: owner?.ifcUsername ?? null, joinedAt: org.createdAt, warnings: [],
  });
  return org;
}
export async function updateOrg(id: number, patch: Partial<Org>): Promise<void> {
  await b.patch("orgs", id, patch);
}

/* ---------- Memberships ---------- */
export async function getMembership(orgId: number, userId: number): Promise<Membership | null> {
  return (await b.byOrg<Membership>("members", orgId)).find((m) => m.userId === userId) || null;
}
export async function getMembershipById(id: number): Promise<Membership | null> {
  return b.byId<Membership>("members", id);
}
export async function listMembers(orgId: number): Promise<Membership[]> {
  return (await b.byOrg<Membership>("members", orgId)).sort((a, c) => a.callsign.localeCompare(c.callsign));
}
export async function createMembership(input: {
  orgId: number; userId: number; role?: Role; callsign: string; status?: MemberStatus;
  baseMinutes?: number; basePireps?: number; ifUsername?: string | null; rankLabel?: string | null;
}): Promise<Membership> {
  return b.insert<Membership>("members", {
    id: undefined as unknown as number, orgId: input.orgId, userId: input.userId, role: input.role ?? "pilot",
    callsign: input.callsign, status: input.status ?? "active", rankLabel: input.rankLabel ?? null,
    baseMinutes: input.baseMinutes ?? 0, basePireps: input.basePireps ?? 0,
    ifUsername: input.ifUsername ?? null, joinedAt: new Date().toISOString(), warnings: [],
  });
}
export async function updateMembership(id: number, patch: Partial<Membership>): Promise<void> {
  await b.patch("members", id, patch);
}
export async function deleteMembership(id: number): Promise<void> {
  await b.remove("members", id);
}

/* Credited stats for a member = carried-over base + approved PIREP minutes. */
export async function memberStats(m: Membership): Promise<{ minutes: number; pireps: number }> {
  const ps = (await b.byKey<Pirep>("pireps", "membershipId", m.id)).filter((p) => p.status === "approved");
  return { minutes: m.baseMinutes + ps.reduce((s, p) => s + p.minutes, 0), pireps: m.basePireps + ps.length };
}

/* ---------- PIREPs ---------- */
export async function listPireps(orgId: number, filter?: { status?: string; membershipId?: number }): Promise<Pirep[]> {
  let rows = await b.byOrg<Pirep>("pireps", orgId);
  if (filter?.status) rows = rows.filter((p) => p.status === filter.status);
  if (filter?.membershipId) rows = rows.filter((p) => p.membershipId === filter.membershipId);
  return rows.sort((a, c) => c.filedAt.localeCompare(a.filedAt));
}
export async function createPirep(p: Omit<Pirep, "id" | "status" | "filedAt" | "reviewedAt" | "reviewer">, autoApprove: boolean): Promise<Pirep> {
  return b.insert<Pirep>("pireps", {
    ...p, id: undefined as unknown as number, status: autoApprove ? "approved" : "pending",
    filedAt: new Date().toISOString(), reviewedAt: autoApprove ? new Date().toISOString() : null,
    reviewer: autoApprove ? "auto" : null,
  });
}
export async function getPirep(id: number): Promise<Pirep | null> {
  return b.byId<Pirep>("pireps", id);
}
export async function updatePirep(id: number, patch: Partial<Pirep>): Promise<void> {
  await b.patch("pireps", id, patch);
}

/* ---------- News ---------- */
export async function listNews(orgId: number): Promise<NewsPost[]> {
  return (await b.byOrg<NewsPost>("news", orgId)).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
}
export async function createNews(n: Omit<NewsPost, "id" | "createdAt">): Promise<NewsPost> {
  return b.insert<NewsPost>("news", { ...n, id: undefined as unknown as number, createdAt: new Date().toISOString() });
}
export async function deleteNews(id: number): Promise<void> {
  await b.remove("news", id);
}

/* ---------- LOA ---------- */
export async function listLoas(orgId: number): Promise<Loa[]> {
  return (await b.byOrg<Loa>("loas", orgId)).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
}
export async function createLoa(l: Omit<Loa, "id" | "createdAt" | "status" | "startAt" | "endAt" | "resolver">): Promise<Loa> {
  return b.insert<Loa>("loas", { ...l, id: undefined as unknown as number, status: "pending", startAt: null, endAt: null, resolver: null, createdAt: new Date().toISOString() });
}
export async function updateLoa(id: number, patch: Partial<Loa>): Promise<void> {
  await b.patch("loas", id, patch);
}

/* ---------- Reports ---------- */
export async function listReports(orgId: number): Promise<Report[]> {
  return (await b.byOrg<Report>("reports", orgId)).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
}
export async function createReport(r: Omit<Report, "id" | "createdAt" | "status" | "resolver">): Promise<Report> {
  return b.insert<Report>("reports", { ...r, id: undefined as unknown as number, status: "open", resolver: null, createdAt: new Date().toISOString() });
}
export async function updateReport(id: number, patch: Partial<Report>): Promise<void> {
  await b.patch("reports", id, patch);
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
  return (await b.byOrg<Invite>("invites", orgId)).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
}
export async function createInvite(input: { orgId: number; kind: "multi" | "single"; ifcUsername?: string | null; createdBy: string }): Promise<Invite> {
  return b.insert<Invite>("invites", {
    id: undefined as unknown as number, orgId: input.orgId, code: randomCode(8), kind: input.kind,
    ifcUsername: input.ifcUsername?.trim() || null, createdBy: input.createdBy,
    usedByUserId: null, createdAt: new Date().toISOString(), expiresAt: null,
  });
}
export async function findJoinTarget(code: string): Promise<{ org: Org; invite: Invite | null } | null> {
  const norm = code.trim().toUpperCase();
  const org = (await b.all<Org>("orgs")).find((o) => o.joinCode.toUpperCase() === norm);
  if (org) return { org, invite: null };
  const inv = (await b.all<Invite>("invites")).find((i) => i.code.toUpperCase() === norm);
  if (inv) {
    const o = await b.byId<Org>("orgs", inv.orgId);
    if (o) return { org: o, invite: inv };
  }
  return null;
}
export async function consumeInvite(inviteId: number, userId: number): Promise<void> {
  const inv = await b.byId<Invite>("invites", inviteId);
  if (inv && inv.kind === "single") await b.patch("invites", inviteId, { usedByUserId: userId });
}

/* ---------- Routes ---------- */
export async function listRoutes(orgId: number): Promise<Route[]> {
  return (await b.byOrg<Route>("routes", orgId)).sort((a, c) => Number(c.featured) - Number(a.featured) || a.flightNo.localeCompare(c.flightNo));
}
export async function createRoute(r: Omit<Route, "id">): Promise<Route> {
  return b.insert<Route>("routes", { ...r, id: undefined as unknown as number });
}
export async function updateRoute(id: number, patch: Partial<Route>): Promise<void> {
  await b.patch("routes", id, patch);
}
export async function deleteRoute(id: number): Promise<void> {
  await b.remove("routes", id);
}

/* ---------- Events ---------- */
export async function listEvents(orgId: number): Promise<EventItem[]> {
  return (await b.byOrg<EventItem>("events", orgId)).sort((a, c) => a.startAt.localeCompare(c.startAt));
}
export async function getEvent(id: number): Promise<EventItem | null> {
  return b.byId<EventItem>("events", id);
}
export async function createEvent(e: Omit<EventItem, "id" | "signups">): Promise<EventItem> {
  return b.insert<EventItem>("events", { ...e, id: undefined as unknown as number, signups: [] });
}
export async function deleteEvent(id: number): Promise<void> {
  await b.remove("events", id);
}
export async function toggleEventSignup(eventId: number, membershipId: number): Promise<void> {
  const e = await b.byId<EventItem>("events", eventId);
  if (!e) return;
  const signups = e.signups.includes(membershipId) ? e.signups.filter((m) => m !== membershipId) : [...e.signups, membershipId];
  await b.patch("events", eventId, { signups });
}

/* ---------- Awards & badges ---------- */
export async function listAwards(orgId: number): Promise<Award[]> {
  return b.byOrg<Award>("awards", orgId);
}
export async function createAward(a: Omit<Award, "id">): Promise<Award> {
  return b.insert<Award>("awards", { ...a, id: undefined as unknown as number });
}
export async function deleteAward(id: number): Promise<void> {
  await b.remove("awards", id);
  await b.removeWhere("earned", "awardId", id);
}
export async function earnedFor(membershipId: number): Promise<EarnedAward[]> {
  return b.byKey<EarnedAward>("earned", "membershipId", membershipId);
}
export async function grantAward(orgId: number, membershipId: number, awardId: number): Promise<boolean> {
  const existing = await b.byKey<EarnedAward>("earned", "membershipId", membershipId);
  if (existing.some((e) => e.awardId === awardId)) return false;
  await b.insert<EarnedAward>("earned", { id: undefined as unknown as number, orgId, membershipId, awardId, at: new Date().toISOString() });
  return true;
}

/* ---------- NOTAMs ---------- */
export async function listNotams(orgId: number): Promise<Notam[]> {
  return (await b.byOrg<Notam>("notams", orgId)).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
}
export async function createNotam(n: Omit<Notam, "id" | "createdAt">): Promise<Notam> {
  return b.insert<Notam>("notams", { ...n, id: undefined as unknown as number, createdAt: new Date().toISOString() });
}
export async function deleteNotam(id: number): Promise<void> {
  await b.remove("notams", id);
}

/* ---------- Challenges ---------- */
export async function listChallenges(orgId: number): Promise<Challenge[]> {
  return b.byOrg<Challenge>("challenges", orgId);
}
export async function createChallenge(c: Omit<Challenge, "id">): Promise<Challenge> {
  return b.insert<Challenge>("challenges", { ...c, id: undefined as unknown as number });
}
export async function deleteChallenge(id: number): Promise<void> {
  await b.remove("challenges", id);
}
export async function challengeProgressFor(membershipId: number): Promise<ChallengeProgress[]> {
  return b.byKey<ChallengeProgress>("challengeProgress", "membershipId", membershipId);
}

/* ---------- Points (Frequent Flyer) ---------- */
export async function addPoints(orgId: number, membershipId: number, delta: number, reason: string): Promise<void> {
  await b.insert<PointsEntry>("points", { id: undefined as unknown as number, orgId, membershipId, delta, reason, at: new Date().toISOString() });
}
export async function pointsBalance(membershipId: number): Promise<number> {
  return (await b.byKey<PointsEntry>("points", "membershipId", membershipId)).reduce((s, p) => s + p.delta, 0);
}
export async function listPoints(membershipId: number): Promise<PointsEntry[]> {
  return (await b.byKey<PointsEntry>("points", "membershipId", membershipId)).sort((a, c) => c.at.localeCompare(a.at));
}

/* ---------- Shop & redemptions ---------- */
export async function listShop(orgId: number): Promise<ShopItem[]> {
  return b.byOrg<ShopItem>("shop", orgId);
}
export async function createShopItem(s: Omit<ShopItem, "id">): Promise<ShopItem> {
  return b.insert<ShopItem>("shop", { ...s, id: undefined as unknown as number });
}
export async function deleteShopItem(id: number): Promise<void> {
  await b.remove("shop", id);
}
export async function listRedemptions(orgId: number): Promise<Redemption[]> {
  return (await b.byOrg<Redemption>("redemptions", orgId)).sort((a, c) => c.at.localeCompare(a.at));
}
export async function redeemItem(orgId: number, membershipId: number, itemId: number): Promise<{ ok: boolean; error?: string }> {
  const item = await b.byId<ShopItem>("shop", itemId);
  if (!item || item.orgId !== orgId) return { ok: false, error: "Item not found" };
  if (item.stock === 0) return { ok: false, error: "Out of stock" };
  if ((await pointsBalance(membershipId)) < item.cost) return { ok: false, error: "Not enough points" };
  if (item.stock > 0) await b.patch("shop", itemId, { stock: item.stock - 1 });
  await addPoints(orgId, membershipId, -item.cost, `Redeemed: ${item.name}`);
  await b.insert<Redemption>("redemptions", { id: undefined as unknown as number, orgId, membershipId, itemId, cost: item.cost, status: "pending", at: new Date().toISOString() });
  return { ok: true };
}
export async function updateRedemption(id: number, patch: Partial<Redemption>): Promise<void> {
  await b.patch("redemptions", id, patch);
}

/* ---------- Notifications ---------- */
export async function notify(orgId: number, membershipId: number, text: string, href: string | null = null): Promise<void> {
  await b.insert<Notification>("notifications", { id: undefined as unknown as number, orgId, membershipId, text, href, read: false, at: new Date().toISOString() });
}
export async function listNotifications(membershipId: number): Promise<Notification[]> {
  return (await b.byKey<Notification>("notifications", "membershipId", membershipId)).sort((a, c) => c.at.localeCompare(a.at));
}
export async function markNotificationsRead(membershipId: number): Promise<void> {
  await b.markNotifsRead(membershipId);
}

/* ---------- Application forms ---------- */
export async function getAppForm(orgId: number): Promise<ApplicationForm> {
  const existing = await b.getAppFormRow(orgId);
  if (existing) return existing;
  const fresh: ApplicationForm = { orgId, enabled: true, passScore: 70, intro: "Apply to fly with us.", questions: [] };
  await b.upsertAppForm(fresh);
  return fresh;
}
export async function saveAppForm(orgId: number, patch: Partial<ApplicationForm>): Promise<void> {
  const current = await getAppForm(orgId);
  await b.upsertAppForm({ ...current, ...patch, orgId });
}
export async function listApplications(orgId: number): Promise<Application[]> {
  return (await b.byOrg<Application>("applications", orgId)).sort((a, c) => c.at.localeCompare(a.at));
}
export async function createApplication(a: Omit<Application, "id" | "at" | "status">): Promise<Application> {
  return b.insert<Application>("applications", { ...a, id: undefined as unknown as number, status: "pending", at: new Date().toISOString() });
}
export async function updateApplication(id: number, patch: Partial<Application>): Promise<void> {
  await b.patch("applications", id, patch);
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
  const myProgress = await challengeProgressFor(m.id);
  for (const c of await listChallenges(org.id)) {
    if (!c.active) continue;
    let prog = myProgress.find((p) => p.challengeId === c.id);
    if (!prog) {
      prog = { id: await b.nextId(), orgId: org.id, membershipId: m.id, challengeId: c.id, progress: 0, completedAt: null };
      await b.insert<ChallengeProgress>("challengeProgress", prog);
    }
    if (prog.completedAt) continue;
    let delta = 0;
    if (c.goalType === "pireps") delta = 1;
    else if (c.goalType === "hours") delta = hours;
    else if (c.goalType === "route" && c.routeIcaoPair) {
      const [d, a2] = c.routeIcaoPair.split("-");
      if (pirep.dep === d && pirep.arr === a2) delta = 1;
    }
    const progress = prog.progress + delta;
    const completedAt = progress >= c.goalValue ? new Date().toISOString() : null;
    await b.patch("challengeProgress", prog.id, { progress, completedAt });
    if (completedAt) {
      await addPoints(org.id, m.id, c.reward, `Challenge: ${c.title}`);
      await notify(org.id, m.id, `Challenge complete: ${c.title} (+${c.reward} ${org.settings.currency})`, "/pilot");
    }
  }
}
