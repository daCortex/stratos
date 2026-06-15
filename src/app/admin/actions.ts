"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hashSecret } from "@/lib/crypto";
import { deleteOrg, transferOrgOwner, getUserByIfc, updateUser, deleteUser, updateOrg } from "@/lib/store";

async function guard() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?next=/admin");
  return admin!;
}

/* ---- VAs ---- */
export async function deleteVaAction(formData: FormData) {
  await guard();
  await deleteOrg(Number(formData.get("id")));
  revalidatePath("/admin/vas");
}
export async function transferVaAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const u = await getUserByIfc(String(formData.get("ifc") || "").trim());
  if (u) await transferOrgOwner(id, u.id);
  revalidatePath("/admin/vas");
}
export async function renameVaAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (name) await updateOrg(id, { name });
  revalidatePath("/admin/vas");
}

/* ---- accounts ---- */
export async function setPasswordAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const pw = String(formData.get("password") || "");
  if (pw) await updateUser(id, { passwordHash: hashSecret(pw) });
  revalidatePath("/admin/users");
}
export async function renameUserAction(formData: FormData) {
  await guard();
  await updateUser(Number(formData.get("id")), { displayName: String(formData.get("name") || "").trim() });
  revalidatePath("/admin/users");
}
export async function toggleAdminAction(formData: FormData) {
  await guard();
  await updateUser(Number(formData.get("id")), { isAdmin: formData.get("make") === "1" });
  revalidatePath("/admin/users");
}
export async function deleteUserAction(formData: FormData) {
  const me = await guard();
  const id = Number(formData.get("id"));
  if (id !== me.id) await deleteUser(id); // never delete yourself
  revalidatePath("/admin/users");
}
