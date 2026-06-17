import Link from "next/link";
import PlatformHeader from "@/components/PlatformHeader";
import { listAllOrgs, listMembers } from "@/lib/store";
import { DISCORD_URL } from "@/lib/site";

export default async function Home() {
  const orgs = await listAllOrgs();
  const featured = await Promise.all(
    orgs.slice(0, 6).map(async (o) => ({ org: o, members: (await listMembers(o.id)).length }))
  );

  const features: [string, string, React.ReactNode][] = [
    ["Brand it like it's yours", "Logo, hue, fonts, background, animated banner, dark or light — every page repaints to your airline. Pilots never see Stratos.",
      <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287z" /><path d="M5 3v4M3 5h4M17 19h4M19 17v4" /></>],
    ["The whole crew center", "Roster, ranks, PIREP filing & review, leaderboards, news, LOA and reports — multi-tenant, with a live studio.",
      <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>],
    ["Routes, events & maps", "A searchable route network on a live map, Route of the Week, group events with sign-ups, and SimBrief briefings.",
      <><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>],
    ["Frequent Flyer & shop", "Pilots earn points on every flight, climb challenges, unlock auto-granted award badges and spend points in your rewards shop.",
      <><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></>],
    ["Recruit your way", "Build a custom application form with auto-graded exams, NOTAMs, codeshare partners, and Discord webhooks out of the box.",
      <><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>],
    ["Pilots sign in once", "One IFC account, file for any VA they belong to. Join by code, one-time invite, or IFC-username invite. Import & export as CSV.",
      <><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" /><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /></>],
  ];

  return (
    <>
      <PlatformHeader />
      <main>
        <section className="container-x" style={{ paddingTop: 88, paddingBottom: 72, textAlign: "center" }}>
          <div className="reveal" style={{ maxWidth: 820, margin: "0 auto" }}>
            <span className="pill" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>For Infinite Flight virtual airlines</span>
            <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 1.05, margin: "1.2rem 0 0" }}>
              Launch a crew center<br /><span className="gradient-text-shine">that feels like your own website.</span>
            </h1>
            <p className="muted" style={{ fontSize: "1.15rem", marginTop: "1.4rem", maxWidth: 620, marginInline: "auto" }}>
              Stratos is the platform that quietly powers virtual airline crew centers. Sign up, brand it, add your pilots —
              and it never feels like a platform. It feels like yours.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
              <Link href="/new" className="btn btn-primary" style={{ padding: "0.8rem 1.6rem", fontSize: "1rem" }}>Create your crew center →</Link>
              <Link href="/va/skyline" className="btn btn-ghost" style={{ padding: "0.8rem 1.6rem", fontSize: "1rem" }}>See a live example</Link>
            </div>
            <p className="faint" style={{ fontSize: "0.82rem", marginTop: "1rem" }}>Demo login — IFC username <b>demo</b>, password <b>demo</b></p>
          </div>
        </section>

        <section className="container-x" style={{ paddingBottom: 72 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {features.map(([t, d, icon], i) => (
              <div key={i} className="card" style={{ padding: "1.5rem" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 16, background: "color-mix(in srgb, var(--primary) 13%, var(--surface-2))", border: "1px solid color-mix(in srgb, var(--primary) 32%, var(--border))", boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06)" }}>
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>{icon}</svg>
                </div>
                <h3 style={{ fontSize: "1.05rem", margin: "0 0 0.4rem" }}>{t}</h3>
                <p className="muted" style={{ fontSize: "0.92rem", margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-x" style={{ paddingBottom: 100 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Airlines flying on Stratos</h2>
            <Link href="/explore" className="muted" style={{ fontSize: "0.9rem" }}>Explore all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {featured.map(({ org, members }) => (
              <Link key={org.id} href={`/va/${org.slug}`} className="card" style={{ padding: "1.2rem", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: `hsl(${org.branding.hue} 65% 55%)`, display: "grid", placeItems: "center", fontWeight: 700, color: "white", fontFamily: "var(--font-head)" }}>
                    {org.name.slice(0, 1)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{org.name}</div>
                    <div className="faint" style={{ fontSize: "0.8rem" }}>{org.callsignPrefix} · {members} pilot{members === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: "0.86rem", margin: "0.9rem 0 0" }}>{org.settings.tagline}</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="hairline">
          <div className="container-x" style={{ padding: "2rem 1.25rem", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span className="faint">Stratos — crew centers for virtual airlines.</span>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <Link href="/help" className="muted">Help &amp; guides</Link>
              <Link href="/status" className="muted">Status</Link>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>Discord</a>
              <Link href="/explore" className="muted">Explore</Link>
              <span className="faint">Not affiliated with Infinite Flight.</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
