import { discordConfigured } from "@/lib/discord";

/* Renders the "Continue with Discord" button only when OAuth is configured. */
export default function DiscordButton({ next, label = "Continue with Discord" }: { next: string; label?: string }) {
  if (!discordConfigured) return null;
  return (
    <a
      href={`/api/auth/discord?next=${encodeURIComponent(next)}`}
      className="btn"
      style={{ width: "100%", marginTop: 14, background: "#5865F2", color: "#fff", gap: 8 }}
    >
      <svg width="18" height="14" viewBox="0 0 71 55" fill="currentColor" aria-hidden><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.5a40.8 40.8 0 0 0-1.9 3.9 54.5 54.5 0 0 0-16.3 0A40.8 40.8 0 0 0 25.4.5 58.5 58.5 0 0 0 11 4.9C1.6 18.7-1 32.1.3 45.4a58.9 58.9 0 0 0 18 9.1 43.4 43.4 0 0 0 3.8-6.3 38 38 0 0 1-6-2.9l1.5-1.2a42 42 0 0 0 36 0l1.5 1.2a38 38 0 0 1-6 2.9 43.4 43.4 0 0 0 3.8 6.3 58.7 58.7 0 0 0 18-9.1c1.6-15.4-2.6-28.7-10.8-40.5ZM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Z" /></svg>
      {label}
    </a>
  );
}
