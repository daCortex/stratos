import Link from "next/link";
import PlatformHeader from "@/components/PlatformHeader";
import { listAllOrgs, listMembers } from "@/lib/store";

export default async function Home() {
  const orgs = await listAllOrgs();
  const featured = await Promise.all(
    orgs.slice(0, 6).map(async (o) => ({ org: o, members: (await listMembers(o.id)).length }))
  );

  const features = [
    ["Brand it like it's yours", "Logo, hue, fonts, background, animated banner, dark or light — every page repaints to your airline. Pilots never see Stratos."],
    ["The whole crew center", "Roster, ranks, PIREP filing & review, leaderboards, news, LOA and reports — multi-tenant, with a live studio."],
    ["Routes, events & maps", "A searchable route network on a live map, Route of the Week, group events with sign-ups, and SimBrief briefings."],
    ["Frequent Flyer & shop", "Pilots earn points on every flight, climb challenges, unlock auto-granted award badges and spend points in your rewards shop."],
    ["Recruit your way", "Build a custom application form with auto-graded exams, NOTAMs, codeshare partners, and Discord webhooks out of the box."],
    ["Pilots sign in once", "One IFC account, file for any VA they belong to. Join by code, one-time invite, or IFC-username invite. Import & export as CSV."],
  ];

  return (
    <>
      <PlatformHeader />
      <main>
        <section className="container-x" style={{ paddingTop: 88, paddingBottom: 72, textAlign: "center" }}>
          <div className="reveal" style={{ maxWidth: 820, margin: "0 auto" }}>
            <span className="pill" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>For Infinite Flight virtual airlines</span>
            <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 1.05, margin: "1.2rem 0 0" }}>
              Launch a crew center<br /><span className="gradient-text">that feels like your own website.</span>
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
            {features.map(([t, d], i) => (
              <div key={i} className="card" style={{ padding: "1.4rem" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), var(--accent))", marginBottom: 14 }} />
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
            <div style={{ display: "flex", gap: 18 }}>
              <Link href="/help" className="muted">Help &amp; guides</Link>
              <Link href="/status" className="muted">Status</Link>
              <Link href="/explore" className="muted">Explore</Link>
              <span className="faint">Not affiliated with Infinite Flight.</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
