"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { currentUser, orgRole } from "@/lib/auth";
import { getOrgBySlug, updateOrg } from "@/lib/store";
import type { Branding, NavItem, Hub, Aircraft, Rank, Multiplier, OrgSettings } from "@/lib/types";

function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

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
    const d = normalizeDomain(cfg.customDomain || "");
    patch.customDomain = d || null;
    // Changing the domain forces re-verification; mint a token if there isn't one.
    if (d !== normalizeDomain(org!.customDomain || "")) {
      patch.domainVerified = false;
      patch.domainToken = org!.domainToken || randomBytes(16).toString("hex");
    } else if (d && !org!.domainToken) {
      patch.domainToken = randomBytes(16).toString("hex");
    }
    if (!d) { patch.domainVerified = false; patch.domainToken = null; }
  }

  await updateOrg(org!.id, patch);
  revalidatePath(`/va/${slug}`, "layout");
  redirect(`/va/${slug}/settings?saved=1`);
}

/* Verify domain ownership via a DNS TXT record, then (if configured) register
   the domain with Vercel so it actually serves + gets an SSL cert. */
export async function verifyDomainAction(slug: string) {
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  const { isOwner } = await orgRole(org!, user);
  if (!isOwner) redirect(`/va/${slug}`);
  const domain = normalizeDomain(org!.customDomain || "");
  const token = org!.domainToken;
  if (!domain || !token) redirect(`/va/${slug}/settings?domain=notoken`);

  // 1) Prove ownership: look for our token in a TXT record at _stratos.<domain>.
  let owns = false;
  try {
    const records = await resolveTxt(`_stratos.${domain}`);
    const flat = records.flat().join(" ");
    owns = flat.includes(`stratos-domain-verify=${token}`);
  } catch {
    owns = false;
  }
  if (!owns) redirect(`/va/${slug}/settings?domain=dnsfail`);

  // 2) Register the domain with Vercel (so it routes + gets SSL). Dormant
  //    until a Vercel token + project id are configured.
  const vToken = process.env.VERCEL_TOKEN;
  const vProject = process.env.VERCEL_PROJECT_ID;
  const vTeam = process.env.VERCEL_TEAM_ID;
  if (vToken && vProject) {
    try {
      const qs = vTeam ? `?teamId=${vTeam}` : "";
      await fetch(`https://api.vercel.com/v10/projects/${vProject}/domains${qs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${vToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: domain }),
      });
    } catch {
      /* domain may already be added — ignore */
    }
  }

  await updateOrg(org!.id, { domainVerified: true });
  revalidatePath(`/va/${slug}`, "layout");
  redirect(`/va/${slug}/settings?domain=verified`);
}
