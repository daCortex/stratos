import PlatformHeader from "@/components/PlatformHeader";
import HelpCenter from "@/components/HelpCenter";
import { DISCORD_URL } from "@/lib/site";

export const metadata = { title: "Stratos — Help & guides" };

export default function HelpPage() {
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ paddingTop: 36, paddingBottom: 80 }}>
        <div style={{ marginBottom: 18 }}>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>Documentation</span>
          <h1 style={{ fontSize: "1.9rem", margin: "4px 0 0" }}>Help &amp; guides</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Everything you need to run a crew center on Stratos — plus troubleshooting and FAQ.</p>
        </div>

        <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="card card-link" style={{ display: "flex", alignItems: "center", gap: 14, padding: "1.1rem 1.4rem", marginBottom: 22, borderColor: "color-mix(in srgb, var(--primary) 45%, var(--border))" }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: "#5865F2", display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>Need a hand? Join our Discord</div>
            <div className="faint" style={{ fontSize: "0.86rem" }}>Community &amp; support for everything Stratos — ask questions and get help fast.</div>
          </div>
          <span className="btn btn-primary btn-sm">Open Discord ↗</span>
        </a>

        <HelpCenter />
      </main>
    </>
  );
}
