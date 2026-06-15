import { getOrgBySlug } from "@/lib/store";

export default async function NetworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const kindColor: Record<string, string> = { primary: "var(--primary)", secondary: "var(--accent)", focus: "var(--text-dim)" };
  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Network</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Hubs &amp; bases</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {org.hubs.map((h) => (
          <div key={h.id} className="card" style={{ padding: "1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: "1.6rem", fontWeight: 700 }}>{h.icao}</div>
              <span className="pill" style={{ color: kindColor[h.kind], borderColor: kindColor[h.kind], textTransform: "capitalize" }}>{h.kind}</span>
            </div>
            <div className="muted" style={{ marginTop: 4 }}>{h.city}</div>
            <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: "0.85rem" }}>
              <div><div style={{ fontWeight: 700 }}>{h.departures}</div><div className="faint" style={{ fontSize: "0.72rem" }}>departures/day</div></div>
              <div><div style={{ fontWeight: 700 }}>{h.destinations}</div><div className="faint" style={{ fontSize: "0.72rem" }}>destinations</div></div>
            </div>
          </div>
        ))}
      </div>
      {org.hubs.length === 0 && <p className="muted">No hubs yet.</p>}
    </main>
  );
}
