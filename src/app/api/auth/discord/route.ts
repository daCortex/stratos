import { NextRequest, NextResponse } from "next/server";
import { discordConfigured, discordAuthUrl } from "@/lib/discord";

export async function GET(req: NextRequest) {
  if (!discordConfigured) return NextResponse.redirect(new URL("/login", req.url));
  const next = req.nextUrl.searchParams.get("next") || "/app";
  const redirectUri = `${req.nextUrl.origin}/api/auth/discord/callback`;
  const state = Buffer.from(JSON.stringify({ next })).toString("base64url");
  return NextResponse.redirect(discordAuthUrl(redirectUri, state));
}
