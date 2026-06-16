import { NextRequest, NextResponse } from "next/server";
import { discordExchange } from "@/lib/discord";
import { getUserByDiscordId, getUserByIfc, createUser, updateUser } from "@/lib/store";
import { setSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state") || "";
  let next = "/app";
  try { next = JSON.parse(Buffer.from(stateRaw, "base64url").toString()).next || "/app"; } catch { /* keep default */ }
  if (!code) return NextResponse.redirect(new URL("/login?error=discord", req.url));

  const redirectUri = `${req.nextUrl.origin}/api/auth/discord/callback`;
  const du = await discordExchange(code, redirectUri);
  if (!du) return NextResponse.redirect(new URL("/login?error=discord", req.url));

  // Find by Discord id; else link an existing IFC account by matching username; else create.
  let user = await getUserByDiscordId(du.id);
  if (!user) {
    const existing = await getUserByIfc(du.username);
    if (existing) {
      await updateUser(existing.id, { discordId: du.id });
      user = existing;
    } else {
      user = await createUser(du.username, du.global_name || du.username, null);
      await updateUser(user.id, { discordId: du.id });
    }
  }

  await setSession(user.id);
  return NextResponse.redirect(new URL(next, req.url));
}
