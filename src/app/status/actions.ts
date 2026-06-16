"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createIncident, resolveIncident, deleteIncident } from "@/lib/store";
import type { IncidentImpact } from "@/lib/types";

async function guard() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?next=/status");
}

export async function postIncidentAction(formData: FormData) {
  await guard();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title) return;
  await createIncident({ title, body, impact: (String(formData.get("impact") || "minor") as IncidentImpact) });
  revalidatePath("/status");
}
export async function resolveIncidentAction(formData: FormData) {
  await guard();
  await resolveIncident(Number(formData.get("id")));
  revalidatePath("/status");
}
export async function deleteIncidentAction(formData: FormData) {
  await guard();
  await deleteIncident(Number(formData.get("id")));
  revalidatePath("/status");
}
