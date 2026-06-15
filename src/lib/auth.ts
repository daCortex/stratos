import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getUserById, getMembership } from "./store";
import type { PlatformUser, Org, Membership } from "./types";

/* ----------------------------------------------------------------
   Platform session. A signed cookie carries the platform user id.
   Org-level permission is resolved per request from their membership,
   so the same account can be an owner of one VA and a pilot in another.
------------------------------------------------------------------- */

const SESSION_COOKIE = "stratos_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret";

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token: string): { uid: number } | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

export async function setSession(userId: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign({ uid: userId }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function currentUser(): Promise<PlatformUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = verify(raw);
  if (!payload) return null;
  return getUserById(payload.uid);
}

/* Resolve the signed-in user's role within a specific VA. */
export async function orgRole(org: Org, user: PlatformUser | null): Promise<{ membership: Membership | null; canManage: boolean; isOwner: boolean }> {
  if (!user) return { membership: null, canManage: false, isOwner: false };
  const m = await getMembership(org.id, user.id);
  const isOwner = !!m && (m.role === "owner" || org.ownerUserId === user.id);
  const canManage = !!m && (m.role === "owner" || m.role === "staff");
  return { membership: m, canManage, isOwner };
}
