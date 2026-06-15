import Link from "next/link";
import PlatformHeader from "@/components/PlatformHeader";
import { listAllOrgs, listMembers } from "@/lib/store";

export default async function ExplorePage() {
  const orgs = await listAllOrgs();
  const rows = await Promise.all(orgs.map(async (o) => ({ org: o, members: (await listMembers(o.id)).length })));
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <h1 style={{ fontSize: "2rem" }}>Explore airlines</h1>
        <p className="muted">Every VA running on Stratos.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginTop: 24 }}>
          {rows.map(({ org, members }) => (
            <Link key={org.id} href={`/va/${org.slug}`} className="card" style={{ padding: "1.2rem", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: `hsl(${org.branding.hue} 65% 55%)`, display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontFamily: "var(--font-head)" }}>{org.name.slice(0, 1)}</span>
                <div><div style={{ fontWeight: 600 }}>{org.name}</div><div className="faint" style={{ fontSize: "0.8rem" }}>{org.callsignPrefix} · {members} pilots</div></div>
              </div>
              <p className="muted" style={{ fontSize: "0.86rem", marginTop: 12, marginBottom: 0 }}>{org.settings.tagline}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
