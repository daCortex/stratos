import { getOrgBySlug } from "@/lib/store";

export default async function CodesharesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const partners = org.codeshares || [];
  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 820 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Partnerships</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Codeshare partners</h1>
      {partners.length === 0 ? <p className="muted">No codeshare partners listed yet.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {partners.map((p) => (
            <div key={p.id} className="card" style={{ padding: "1.4rem", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 10, background: "var(--surface-2)", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-head)" }}>{p.name.slice(0, 1)}</span>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
