"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOrgBySlug, getMembership, createPirep, createLoa, onPirepApproved, toggleEventSignup, redeemItem, markNotificationsRead } from "@/lib/store";
import { fireWebhook } from "@/lib/webhook";

export async function eventSignupAction(slug: string, formData: FormData) {
  const org = await getOrgBySlug(slug); if (!org) return;
  const user = await currentUser(); if (!user) redirect(`/login?next=/va/${slug}/events`);
  const m = await getMembership(org!.id, user!.id); if (!m) redirect(`/va/${slug}/join`);
  await toggleEventSignup(Number(formData.get("eventId")), m!.id);
  revalidatePath(`/va/${slug}/events`);
}

export async function redeemAction(slug: string, formData: FormData) {
  const org = await getOrgBySlug(slug); if (!org) return;
  const user = await currentUser(); if (!user) redirect(`/login?next=/va/${slug}/shop`);
  const m = await getMembership(org!.id, user!.id); if (!m) redirect(`/va/${slug}/join`);
  const res = await redeemItem(org!.id, m!.id, Number(formData.get("itemId")));
  revalidatePath(`/va/${slug}/shop`);
  redirect(`/va/${slug}/shop?${res.ok ? "redeemed=1" : "error=" + encodeURIComponent(res.error || "failed")}`);
}

export async function markReadAction(slug: string) {
  const org = await getOrgBySlug(slug); if (!org) return;
  const user = await currentUser(); if (!user) return;
  const m = await getMembership(org!.id, user!.id); if (!m) return;
  await markNotificationsRead(m!.id);
  revalidatePath(`/va/${slug}/pilot`);
}

export async function filePirepAction(slug: string, formData: FormData) {
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  if (!user) redirect(`/login?next=/va/${slug}/pilot`);
  const m = await getMembership(org!.id, user!.id);
  if (!m) redirect(`/va/${slug}/join`);

  const rawMinutes = Math.max(0, Math.round((parseFloat(String(formData.get("hours") || "0")) || 0) * 60 + (parseInt(String(formData.get("minutes") || "0")) || 0)));
  const code = String(formData.get("multiplierCode") || "").trim().toUpperCase();
  const mult = org!.multipliers.find((x) => x.code === code);
  const multiplier = mult?.value ?? 1;

  const autoApprove = !org!.settings.pirepRequireReview;
  const pirep = await createPirep(
    {
      orgId: org!.id, membershipId: m!.id,
      flightNo: String(formData.get("flightNo") || "").trim().toUpperCase(),
      dep: String(formData.get("dep") || "").trim().toUpperCase(),
      arr: String(formData.get("arr") || "").trim().toUpperCase(),
      aircraft: String(formData.get("aircraft") || "").trim(),
      rawMinutes, minutes: Math.round(rawMinutes * multiplier), multiplier,
      multiplierCode: mult ? code : null,
      fuelKg: parseInt(String(formData.get("fuelKg") || "")) || null,
      landingRate: parseInt(String(formData.get("landingRate") || "")) || null,
      server: String(formData.get("server") || "") || null,
      remarks: String(formData.get("remarks") || "").trim() || null,
    },
    autoApprove
  );
  if (autoApprove) await onPirepApproved(pirep);
  await fireWebhook(org!.settings.discordWebhook, `**${m!.callsign}** filed ${pirep.flightNo}: ${pirep.dep} → ${pirep.arr} · ${Math.floor(pirep.minutes / 60)}h ${pirep.minutes % 60}m`, "✈️ New PIREP");
  revalidatePath(`/va/${slug}/pilot`);
  redirect(`/va/${slug}/pilot?filed=1`);
}

export async function requestLoaAction(slug: string, formData: FormData) {
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  if (!user) redirect(`/login?next=/va/${slug}/pilot`);
  const m = await getMembership(org!.id, user!.id);
  if (!m) return;
  const days = Math.min(60, Math.max(1, parseInt(String(formData.get("days") || "7")) || 7));
  await createLoa({ orgId: org!.id, membershipId: m!.id, reason: String(formData.get("reason") || "").trim(), days });
  revalidatePath(`/va/${slug}/pilot`);
}
