import { getOrgBySlug } from "@/lib/store";

export default async function RanksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const ladder = [...org.ranks].sort((a, b) => a.hours - b.hours);
  const top = ladder[ladder.length - 1]?.hours || 1;
  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 760 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Progression</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Rank ladder</h1>
      <div style={{ display: "grid", gap: 10 }}>
        {ladder.map((r) => (
          <div key={r.id} className="card" style={{ padding: "1rem 1.3rem", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 40, borderRadius: 4, background: `linear-gradient(var(--primary), var(--accent))`, opacity: 0.35 + 0.65 * (r.hours / top) }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{r.label}</div>
              {r.note && <div className="faint" style={{ fontSize: "0.82rem" }}>{r.note}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-head)" }}>{r.hours}h</div>
              <div className="faint" style={{ fontSize: "0.72rem" }}>minimum</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
