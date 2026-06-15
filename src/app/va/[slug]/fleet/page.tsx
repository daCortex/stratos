import { getOrgBySlug } from "@/lib/store";

export default async function FleetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Equipment</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>The {org.name} fleet</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {org.fleet.map((a) => (
          <div key={a.id} className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "1.4rem" }}>{a.type}</div>
              <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>{a.registration}</span>
            </div>
            <p className="muted" style={{ margin: "0.8rem 0 1rem" }}>{a.tagline}</p>
            <div style={{ display: "flex", gap: 24, fontSize: "0.85rem" }}>
              <div><div className="faint" style={{ fontSize: "0.72rem" }}>SEATS</div><div style={{ fontWeight: 600 }}>{a.seats}</div></div>
              <div><div className="faint" style={{ fontSize: "0.72rem" }}>RANGE</div><div style={{ fontWeight: 600 }}>{a.rangeNm.toLocaleString()} nm</div></div>
            </div>
          </div>
        ))}
      </div>
      {org.fleet.length === 0 && <p className="muted">No aircraft added yet.</p>}
    </main>
  );
}
