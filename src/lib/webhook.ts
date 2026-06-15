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
