"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, orgRole } from "@/lib/auth";
import { getOrgBySlug, updateOrg } from "@/lib/store";
import type { Branding, NavItem, Hub, Aircraft, Rank, Multiplier, OrgSettings } from "@/lib/types";

export async function saveOrgConfigAction(slug: string, formData: FormData) {
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  const { isOwner } = await orgRole(org!, user);
  if (!isOwner) redirect(`/va/${slug}`);

  let cfg: any;
  try { cfg = JSON.parse(String(formData.get("config") || "{}")); } catch { return; }

  const patch: any = {};
  if (typeof cfg.name === "string" && cfg.name.trim()) patch.name = cfg.name.trim();
  if (typeof cfg.callsignPrefix === "string") patch.callsignPrefix = cfg.callsignPrefix.toUpperCase().slice(0, 4);
  if (cfg.branding) patch.branding = cfg.branding as Branding;
  if (Array.isArray(cfg.nav)) patch.nav = cfg.nav as NavItem[];
  if (Array.isArray(cfg.hubs)) patch.hubs = cfg.hubs as Hub[];
  if (Array.isArray(cfg.fleet)) patch.fleet = cfg.fleet as Aircraft[];
  if (Array.isArray(cfg.ranks)) patch.ranks = cfg.ranks as Rank[];
  if (Array.isArray(cfg.multipliers)) patch.multipliers = cfg.multipliers as Multiplier[];
  if (cfg.settings) patch.settings = cfg.settings as OrgSettings;
  if (Array.isArray(cfg.codeshares)) patch.codeshares = cfg.codeshares;
  if (typeof cfg.customDomain === "string" || cfg.customDomain === null) {
    const d = (cfg.customDomain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    patch.customDomain = d || null;
  }

  await updateOrg(org!.id, patch);
  revalidatePath(`/va/${slug}`, "layout");
  redirect(`/va/${slug}/settings?saved=1`);
}
