"use server";

import { redirect } from "next/navigation";
import { hashSecret, verifySecret } from "@/lib/crypto";
import { setSession, clearSession, currentUser } from "@/lib/auth";
import {
  getUserByIfc, createUser, slugAvailable, createOrg, findJoinTarget,
  getMembership, createMembership, consumeInvite, getOrgById,
} from "@/lib/store";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export async function signupAction(formData: FormData) {
  const ifc = String(formData.get("ifc") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/app");
  if (!ifc || !password) redirect("/signup?error=missing");
  const existing = await getUserByIfc(ifc);
  if (existing) redirect("/signup?error=taken");
  const user = await createUser(ifc, name || ifc, hashSecret(password));
  await setSession(user.id);
  redirect(next);
}

export async function loginAction(formData: FormData) {
  const ifc = String(formData.get("ifc") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/app");
  const user = await getUserByIfc(ifc);
  if (!user || !verifySecret(password, user.passwordHash)) redirect(`/login?error=bad&next=${encodeURIComponent(next)}`);
  await setSession(user!.id);
  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createOrgAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/new");
  const name = String(formData.get("name") || "").trim();
  const prefix = String(formData.get("prefix") || "").trim().toUpperCase().slice(0, 4);
  const hue = parseInt(String(formData.get("hue") || "215")) || 215;
  let slug = slugify(String(formData.get("slug") || name));
  if (!name || !slug) redirect("/new?error=missing");
  if (!(await slugAvailable(slug))) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
  const org = await createOrg({ slug, name, callsignPrefix: prefix || slug.slice(0, 3).toUpperCase(), ownerUserId: user!.id, hue });
  redirect(`/va/${org.slug}/settings?welcome=1`);
}

/* Join a VA via permanent join code or one-time/targeted invite. */
export async function joinAction(formData: FormData) {
  const user = await currentUser();
  const code = String(formData.get("code") || "").trim();
  const callsignWanted = String(formData.get("callsign") || "").trim();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join?code=${code}`)}`);
  const target = await findJoinTarget(code);
  if (!target) redirect("/join?error=invalid");
  const { org, invite } = target!;
  if (invite && invite.kind === "single" && invite.usedByUserId) redirect("/join?error=used");
  if (invite && invite.ifcUsername && invite.ifcUsername.toLowerCase() !== user!.ifcUsername.toLowerCase())
    redirect("/join?error=notyou");
  const existing = await getMembership(org.id, user!.id);
  if (existing) redirect(`/va/${org.slug}/pilot`);
  const callsign = callsignWanted || `${org.callsignPrefix}${String(Math.floor(Math.random() * 900 + 100))}`;
  await createMembership({
    orgId: org.id, userId: user!.id, role: "pilot", callsign,
    status: org.settings.requireApproval ? "pending" : "active", ifUsername: user!.ifcUsername,
  });
  if (invite) await consumeInvite(invite.id, user!.id);
  redirect(`/va/${org.slug}/pilot`);
}
