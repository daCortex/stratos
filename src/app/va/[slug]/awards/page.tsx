import { getOrgBySlug, listAwards, getMembership, earnedFor } from "@/lib/store";
import { currentUser } from "@/lib/auth";

export default async function AwardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const awards = await listAwards(org.id);
  const user = await currentUser();
  const m = user ? await getMembership(org.id, user.id) : null;
  const mine = m ? new Set((await earnedFor(m.id)).map((e) => e.awardId)) : new Set<number>();

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 820 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Recognition</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 6px" }}>Awards &amp; badges</h1>
      {m && <p className="muted">You've earned {mine.size} of {awards.length}.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginTop: 22 }}>
        {awards.map((a) => {
          const got = mine.has(a.id);
          return (
            <div key={a.id} className="card" style={{ padding: "1.3rem", textAlign: "center", opacity: m && !got ? 0.5 : 1, borderColor: got ? a.color : "var(--border)" }}>
              <div style={{ fontSize: "2.4rem", filter: m && !got ? "grayscale(1)" : "none" }}>{a.icon}</div>
              <div style={{ fontWeight: 700, marginTop: 6, color: got ? a.color : "var(--text)" }}>{a.name}</div>
              <div className="faint" style={{ fontSize: "0.82rem", marginTop: 4 }}>{a.description}</div>
              {got && <div className="pill" style={{ marginTop: 10, color: a.color, borderColor: a.color }}>Earned ✓</div>}
            </div>
          );
        })}
      </div>
      {awards.length === 0 && <p className="muted">No awards defined yet.</p>}
    </main>
  );
}
