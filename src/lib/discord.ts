/* ----------------------------------------------------------------
   Discord OAuth — "Sign in with Discord".

   Dormant until DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET are set, so the
   button only appears when configured. The redirect URI is derived from the
   request origin, so it works on the platform domain (and any custom domain
   whose callback URL is registered in the Discord app).
------------------------------------------------------------------- */

export const discordConfigured = !!process.env.DISCORD_CLIENT_ID && !!process.env.DISCORD_CLIENT_SECRET;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";

export function discordAuthUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${p.toString()}`;
}

export type DiscordUser = { id: string; username: string; global_name?: string | null; avatar?: string | null };

export async function discordExchange(code: string, redirectUri: string): Promise<DiscordUser | null> {
  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        grant_type: "authorization_code", code, redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) return null;
    const { access_token } = await tokenRes.json();
    const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!userRes.ok) return null;
    return (await userRes.json()) as DiscordUser;
  } catch {
    return null;
  }
}
