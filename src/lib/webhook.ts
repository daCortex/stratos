const DISCORD_WEBHOOK = /^https?:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\//i;

/** A valid Discord webhook URL (used to gate the "test" button & validation). */
export function isWebhookUrl(url: string | undefined | null): boolean {
  return !!url && DISCORD_WEBHOOK.test(url.trim());
}

/* Fire-and-forget Discord webhook. Safe no-op when no URL is configured. */
export async function fireWebhook(url: string | undefined | null, content: string, embedTitle?: string): Promise<void> {
  if (!url || !/^https?:\/\//.test(url)) return;
  try {
    const body: any = { content: embedTitle ? undefined : content, username: "Stratos" };
    if (embedTitle) body.embeds = [{ title: embedTitle, description: content, color: 0xc9a84c }];
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* ignore webhook failures — never block the user action */
  }
}

type EmbedField = { name: string; value: string; inline?: boolean };

/* Post a full Discord embed (title, fields, colour, footer). Fire-and-forget. */
export async function fireEmbed(
  url: string | undefined | null,
  embed: { title: string; color?: number; fields?: EmbedField[]; footer?: string; timestamp?: string }
): Promise<void> {
  if (!url || !/^https?:\/\//.test(url)) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Stratos",
        embeds: [{
          title: embed.title,
          color: embed.color ?? 0xc9a84c,
          fields: embed.fields,
          footer: embed.footer ? { text: embed.footer } : undefined,
          timestamp: embed.timestamp,
        }],
      }),
    });
  } catch {
    /* ignore webhook failures — never block the user action */
  }
}

/* Build & send a rich PIREP-log embed. Routes to the dedicated PIREP channel
   when set, otherwise the org's general Discord webhook. */
export async function firePirepLog(
  org: { name: string; settings: { pirepWebhook?: string; discordWebhook: string } },
  data: {
    pilot: string; callsign: string; flightNo: string; dep: string; arr: string;
    aircraft: string | null; minutes: number; landingRate: number | null;
    server: string | null; multiplierCode: string | null; autoApproved: boolean;
  }
): Promise<void> {
  const url = org.settings.pirepWebhook?.trim() || org.settings.discordWebhook;
  if (!isWebhookUrl(url)) return;
  const dur = `${Math.floor(data.minutes / 60)}h ${String(data.minutes % 60).padStart(2, "0")}m`;
  const fields: EmbedField[] = [
    { name: "Pilot", value: `${data.pilot} · \`${data.callsign}\``, inline: true },
    { name: "Flight", value: `\`${data.flightNo}\``, inline: true },
    { name: "Aircraft", value: data.aircraft || "—", inline: true },
    { name: "Route", value: `${data.dep} → ${data.arr}`, inline: true },
    { name: "Flight time", value: dur, inline: true },
    { name: "Server", value: data.server || "—", inline: true },
  ];
  if (data.landingRate != null) fields.push({ name: "Landing rate", value: `${data.landingRate} fpm`, inline: true });
  if (data.multiplierCode) fields.push({ name: "Multiplier", value: data.multiplierCode, inline: true });
  fields.push({ name: "Status", value: data.autoApproved ? "✅ Approved" : "🕒 Pending review", inline: true });
  await fireEmbed(url, {
    title: `✈️ New PIREP — ${data.flightNo}`,
    color: data.autoApproved ? 0x7dd8a8 : 0xc9a84c,
    fields,
    footer: org.name,
  });
}
