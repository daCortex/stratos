"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, orgRole } from "@/lib/auth";
import {
  getOrgBySlug, getMembershipById, updateMembership, deleteMembership, getMembership,
  createMembership, getUserByIfc, createUser, getPirep, updatePirep, createNews, deleteNews,
  createInvite, updateOrg, updateLoa, updateReport,
} from "@/lib/store";
import { hashSecret } from "@/lib/crypto";

async function guard(slug: string) {
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  const role = await orgRole(org!, user);
  if (!role.canManage) redirect(`/va/${slug}`);
  return { org: org!, user: user!, role };
}

/* ---- roster ---- */
export async function addMemberAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  const ifc = String(formData.get("ifc") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const callsign = String(formData.get("callsign") || "").trim() || `${org.callsignPrefix}${Math.floor(Math.random() * 900 + 100)}`;
  const hours = parseFloat(String(formData.get("hours") || "0")) || 0;
  if (!ifc) return;
  let user = await getUserByIfc(ifc);
  if (!user) user = await createUser(ifc, name || ifc, hashSecret("changeme"));
  const existing = await getMembership(org.id, user.id);
  if (existing) return;
  await createMembership({
    orgId: org.id, userId: user.id, role: "pilot", callsign, status: "active",
    baseMinutes: Math.round(hours * 60), ifUsername: ifc,
  });
  revalidatePath(`/va/${slug}/crew/pilots`);
}

export async function updateMemberAction(slug: string, formData: FormData) {
  await guard(slug);
  const id = Number(formData.get("id"));
  const m = await getMembershipById(id);
  if (!m) return;
  const patch: any = {};
  if (formData.has("callsign")) patch.callsign = String(formData.get("callsign")).trim();
  if (formData.has("status")) patch.status = String(formData.get("status"));
  if (formData.has("role")) patch.role = String(formData.get("role"));
  if (formData.has("rankLabel")) patch.rankLabel = String(formData.get("rankLabel")).trim() || null;
  if (formData.has("baseHours")) patch.baseMinutes = Math.round((parseFloat(String(formData.get("baseHours"))) || 0) * 60);
  await updateMembership(id, patch);
  revalidatePath(`/va/${slug}/crew/pilots`);
}

export async function removeMemberAction(slug: string, formData: FormData) {
  await guard(slug);
  await deleteMembership(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/pilots`);
}

export async function warnMemberAction(slug: string, formData: FormData) {
  await guard(slug);
  const id = Number(formData.get("id"));
  const m = await getMembershipById(id);
  if (!m) return;
  const reason = String(formData.get("reason") || "").trim();
  if (reason) await updateMembership(id, { warnings: [...m.warnings, { reason, at: new Date().toISOString() }] });
  revalidatePath(`/va/${slug}/crew/pilots`);
}

/* ---- PIREP review ---- */
export async function reviewPirepAction(slug: string, formData: FormData) {
  const { user } = await guard(slug);
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  const p = await getPirep(id);
  if (!p || p.status !== "pending") return;
  const approve = decision === "approve";
  await updatePirep(id, { status: approve ? "approved" : "rejected", reviewedAt: new Date().toISOString(), reviewer: user.displayName });
  if (approve) {
    const { onPirepApproved, getPirep: gp } = await import("@/lib/store");
    const fresh = await gp(id);
    if (fresh) await onPirepApproved(fresh);
  }
  revalidatePath(`/va/${slug}/crew/pireps`);
}

/* ---- news ---- */
export async function postNewsAction(slug: string, formData: FormData) {
  const { org, user } = await guard(slug);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return;
  await createNews({
    orgId: org.id, title, body, category: String(formData.get("category") || "Announcement"),
    imageUrl: String(formData.get("imageUrl") || "").trim() || null, author: user.displayName,
  });
  revalidatePath(`/va/${slug}/crew/news`);
  revalidatePath(`/va/${slug}/news`);
}
export async function deleteNewsAction(slug: string, formData: FormData) {
  await guard(slug);
  await deleteNews(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/news`);
}

/* ---- invites ---- */
export async function createInviteAction(slug: string, formData: FormData) {
  const { org, user } = await guard(slug);
  await createInvite({
    orgId: org.id, kind: String(formData.get("kind")) === "single" ? "single" : "multi",
    ifcUsername: String(formData.get("ifc") || "").trim() || null, createdBy: user.displayName,
  });
  revalidatePath(`/va/${slug}/crew/invites`);
}
/* ---- LOA & reports ---- */
export async function resolveLoaAction(slug: string, formData: FormData) {
  const { user } = await guard(slug);
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  const patch: any = { resolver: user.displayName };
  if (decision === "approve") { patch.status = "active"; patch.startAt = new Date().toISOString(); }
  else if (decision === "reject") patch.status = "rejected";
  else if (decision === "end") { patch.status = "ended"; patch.endAt = new Date().toISOString(); }
  await updateLoa(id, patch);
  revalidatePath(`/va/${slug}/crew/loa`);
}

export async function resolveReportAction(slug: string, formData: FormData) {
  const { user } = await guard(slug);
  await updateReport(Number(formData.get("id")), { status: String(formData.get("decision")) === "dismiss" ? "dismissed" : "resolved", resolver: user.displayName });
  revalidatePath(`/va/${slug}/crew/reports`);
}

export async function regenerateJoinCodeAction(slug: string) {
  const { org } = await guard(slug);
  const { randomCode } = await import("@/lib/store");
  await updateOrg(org.id, { joinCode: randomCode(7) });
  revalidatePath(`/va/${slug}/crew/invites`);
}

/* ===================== content management ===================== */
import {
  createRoute, deleteRoute, updateRoute, listRoutes, createEvent, deleteEvent,
  createAward, deleteAward, grantAward, createNotam, deleteNotam, createChallenge,
  deleteChallenge, createShopItem, deleteShopItem, listRedemptions, updateRedemption,
  addPoints, saveAppForm, listApplications, updateApplication, createMembership as _cm,
  notify,
} from "@/lib/store";
import { fireWebhook } from "@/lib/webhook";

/* Routes */
export async function addRouteAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  await createRoute({
    orgId: org.id, flightNo: String(formData.get("flightNo") || "").toUpperCase(),
    dep: String(formData.get("dep") || "").toUpperCase(), arr: String(formData.get("arr") || "").toUpperCase(),
    aircraft: String(formData.get("aircraft") || ""), durationMin: Math.round((parseFloat(String(formData.get("hours") || "0")) || 0) * 60),
    featured: false, notes: null,
  });
  revalidatePath(`/va/${slug}/crew/routes`); revalidatePath(`/va/${slug}/routes`);
}
export async function deleteRouteAction(slug: string, formData: FormData) {
  await guard(slug); await deleteRoute(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/routes`); revalidatePath(`/va/${slug}/routes`);
}
export async function featureRouteAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  const id = Number(formData.get("id"));
  for (const r of await listRoutes(org.id)) await updateRoute(r.id, { featured: r.id === id });
  revalidatePath(`/va/${slug}/crew/routes`); revalidatePath(`/va/${slug}/routes`);
}

/* Events */
export async function addEventAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  await createEvent({
    orgId: org.id, title: String(formData.get("title") || ""), description: String(formData.get("description") || ""),
    dep: String(formData.get("dep") || "").toUpperCase(), arr: String(formData.get("arr") || "").toUpperCase(),
    aircraft: String(formData.get("aircraft") || ""), server: String(formData.get("server") || "Expert"),
    startAt: new Date(String(formData.get("startAt") || "")).toISOString(), bonusCode: String(formData.get("bonusCode") || "").toUpperCase() || null, bannerUrl: null,
  });
  await fireWebhook(org.settings.discordWebhook, `New event: **${String(formData.get("title"))}**`, "📅 Event posted");
  revalidatePath(`/va/${slug}/crew/events`); revalidatePath(`/va/${slug}/events`);
}
export async function deleteEventAction(slug: string, formData: FormData) {
  await guard(slug); await deleteEvent(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/events`); revalidatePath(`/va/${slug}/events`);
}

/* Awards */
export async function addAwardAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  await createAward({
    orgId: org.id, name: String(formData.get("name") || ""), description: String(formData.get("description") || ""),
    icon: String(formData.get("icon") || "🏅"), color: String(formData.get("color") || "#C9A84C"),
    trigger: String(formData.get("trigger") || "manual") as any, threshold: parseInt(String(formData.get("threshold") || "0")) || 0,
  });
  revalidatePath(`/va/${slug}/crew/awards`); revalidatePath(`/va/${slug}/awards`);
}
export async function deleteAwardAction(slug: string, formData: FormData) {
  await guard(slug); await deleteAward(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/awards`); revalidatePath(`/va/${slug}/awards`);
}
export async function grantAwardAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  const membershipId = Number(formData.get("membershipId")); const awardId = Number(formData.get("awardId"));
  if (await grantAward(org.id, membershipId, awardId)) await notify(org.id, membershipId, "You were granted a new award 🏅", "/awards");
  revalidatePath(`/va/${slug}/crew/awards`);
}

/* NOTAMs */
export async function addNotamAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  await createNotam({ orgId: org.id, title: String(formData.get("title") || ""), body: String(formData.get("body") || ""), severity: String(formData.get("severity") || "info") as any, expiresAt: null });
  revalidatePath(`/va/${slug}/crew/notams`); revalidatePath(`/va/${slug}/notams`);
}
export async function deleteNotamAction(slug: string, formData: FormData) {
  await guard(slug); await deleteNotam(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/notams`); revalidatePath(`/va/${slug}/notams`);
}

/* Challenges */
export async function addChallengeAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  await createChallenge({
    orgId: org.id, title: String(formData.get("title") || ""), description: String(formData.get("description") || ""),
    goalType: String(formData.get("goalType") || "pireps") as any, goalValue: parseInt(String(formData.get("goalValue") || "1")) || 1,
    routeIcaoPair: String(formData.get("routeIcaoPair") || "").toUpperCase() || null, reward: parseInt(String(formData.get("reward") || "0")) || 0, active: true,
  });
  revalidatePath(`/va/${slug}/crew/challenges`); revalidatePath(`/va/${slug}/challenges`);
}
export async function deleteChallengeAction(slug: string, formData: FormData) {
  await guard(slug); await deleteChallenge(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/challenges`); revalidatePath(`/va/${slug}/challenges`);
}

/* Shop & redemptions */
export async function addShopItemAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  await createShopItem({
    orgId: org.id, name: String(formData.get("name") || ""), description: String(formData.get("description") || ""),
    cost: parseInt(String(formData.get("cost") || "0")) || 0, stock: parseInt(String(formData.get("stock") ?? "-1")), icon: String(formData.get("icon") || "🎁"),
  });
  revalidatePath(`/va/${slug}/crew/shop`); revalidatePath(`/va/${slug}/shop`);
}
export async function deleteShopItemAction(slug: string, formData: FormData) {
  await guard(slug); await deleteShopItem(Number(formData.get("id")));
  revalidatePath(`/va/${slug}/crew/shop`); revalidatePath(`/va/${slug}/shop`);
}
export async function resolveRedemptionAction(slug: string, formData: FormData) {
  await guard(slug);
  await updateRedemption(Number(formData.get("id")), { status: String(formData.get("decision")) === "fulfil" ? "fulfilled" : "cancelled" });
  revalidatePath(`/va/${slug}/crew/shop`);
}
export async function adjustPointsAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  const membershipId = Number(formData.get("membershipId"));
  const delta = parseInt(String(formData.get("delta") || "0")) || 0;
  if (delta) await addPoints(org.id, membershipId, delta, String(formData.get("reason") || "Staff adjustment"));
  revalidatePath(`/va/${slug}/crew/pilots`);
}

/* Application form builder + applications */
export async function saveAppFormAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  let questions: any[] = [];
  try { questions = JSON.parse(String(formData.get("questions") || "[]")); } catch {}
  await saveAppForm(org.id, {
    enabled: formData.get("enabled") === "on", intro: String(formData.get("intro") || ""),
    passScore: parseInt(String(formData.get("passScore") || "70")) || 70, questions,
  });
  revalidatePath(`/va/${slug}/crew/applications`); revalidatePath(`/va/${slug}/apply`);
}
export async function reviewApplicationAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  const apps = await listApplications(org.id);
  const app = apps.find((a) => a.id === id);
  await updateApplication(id, { status: decision === "accept" ? "accepted" : "rejected" });
  if (decision === "accept" && app) {
    const existing = await getMembership(org.id, app.userId);
    if (!existing) await _cm({ orgId: org.id, userId: app.userId, role: "pilot", callsign: `${org.callsignPrefix}${Math.floor(Math.random() * 900 + 100)}`, status: "active", ifUsername: app.ifcUsername });
  }
  revalidatePath(`/va/${slug}/crew/applications`);
}

/* ---- bulk roster CSV import ---- */
export async function importRosterAction(slug: string, formData: FormData) {
  const { org } = await guard(slug);
  const text = String(formData.get("csv") || "");
  if (!text.trim()) return;
  const { parseCsvObjects, pick, toMinutes } = await import("@/lib/csv");
  const rows = parseCsvObjects(text);
  for (const row of rows) {
    const ifc = pick(row, "ifc", "ifc username", "ifcusername", "username", "pilot", "name");
    if (!ifc) continue;
    const callsign = pick(row, "callsign", "id", "pilot id") || `${org.callsignPrefix}${Math.floor(Math.random() * 9000 + 100)}`;
    const display = pick(row, "display name", "name", "displayname") || ifc;
    const minutes = toMinutes(pick(row, "minutes", "hours", "flight time", "time"));
    const pireps = parseInt(pick(row, "pireps", "flights", "pirep count")) || 0;
    const rankLabel = pick(row, "rank", "rank label") || null;
    let u = await getUserByIfc(ifc);
    if (!u) u = await createUser(ifc, display, hashSecret("changeme"));
    if (await getMembership(org.id, u.id)) continue;
    await createMembership({
      orgId: org.id, userId: u.id, role: "pilot", callsign, status: "active",
      baseMinutes: minutes, basePireps: pireps, ifUsername: ifc, rankLabel,
    });
  }
  revalidatePath(`/va/${slug}/crew/pilots`);
  redirect(`/va/${slug}/crew/pilots?imported=1`);
}
