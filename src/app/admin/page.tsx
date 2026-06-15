import Link from "next/link";
import { listAllOrgs, listAllUsers, orgCounts } from "@/lib/store";

export default async function AdminOverview() {
  const orgs = await listAllOrgs();
  const users = await listAllUsers();
  let members = 0, pireps = 0;
  for (const o of orgs) { const c = await orgCounts(o.id); members += c.members; pireps += c.pireps; }

  const stats = [
    [orgs.length, "Virtual airlines", "/admin/vas"],
    [users.length, "Accounts", "/admin/users"],
    [members, "Memberships", "/admin/vas"],
    [pireps, "PIREPs filed", "/admin/vas"],
  ] as const;

  const recentOrgs = orgs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
        {stats.map(([v, l, href], i) => (
          <Link key={i} href={href} className="card card-link" style={{ padding: "1.4rem", display: "block" }}>
            <div className="gradient-text" style={{ fontSize: "2.1rem", fontWeight: 700, fontFamily: "var(--font-head)" }}>{v.toLocaleString()}</div>
            <div className="faint" style={{ fontSize: "0.85rem", marginTop: 2 }}>{l}</div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Newest airlines</h2>
          <Link href="/admin/vas" className="muted" style={{ fontSize: "0.9rem" }}>Manage all →</Link>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {recentOrgs.map((o) => (
            <Link key={o.id} href={`/va/${o.slug}`} className="card-link" style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 0.9rem", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: `hsl(${o.branding.hue} 60% 52%)`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontFamily: "var(--font-head)" }}>{o.name.slice(0, 1)}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{o.name}</div><div className="faint" style={{ fontSize: "0.8rem" }}>/va/{o.slug} · {o.callsignPrefix}</div></div>
              <span className="faint" style={{ fontSize: "0.8rem" }}>{new Date(o.createdAt).toLocaleDateString()}</span>
            </Link>
          ))}
          {recentOrgs.length === 0 && <p className="muted">No airlines yet.</p>}
        </div>
      </div>
    </div>
  );
}
