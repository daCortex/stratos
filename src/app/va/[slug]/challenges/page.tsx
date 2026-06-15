import { getOrgBySlug, listChallenges, getMembership, challengeProgressFor } from "@/lib/store";
import { currentUser } from "@/lib/auth";

export default async function ChallengesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const challenges = (await listChallenges(org.id)).filter((c) => c.active);
  const user = await currentUser();
  const m = user ? await getMembership(org.id, user.id) : null;
  const prog = m ? await challengeProgressFor(m.id) : [];
  const cur = org.settings.currency;

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 760 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Goals</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Challenges</h1>
      {challenges.length === 0 ? <p className="muted">No active challenges.</p> : (
        <div style={{ display: "grid", gap: 14 }}>
          {challenges.map((c) => {
            const p = prog.find((x) => x.challengeId === c.id);
            const pct = Math.min(100, Math.round(((p?.progress || 0) / c.goalValue) * 100));
            const done = !!p?.completedAt;
            return (
              <div key={c.id} className="card" style={{ padding: "1.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontSize: "1.2rem", margin: 0 }}>{c.title}</h2>
                  <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>+{c.reward} {cur}</span>
                </div>
                <p className="muted" style={{ fontSize: "0.9rem", margin: "6px 0 12px" }}>{c.description}</p>
                {m && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }} className="faint">
                      <span>{done ? "Completed ✓" : `${Math.floor(p?.progress || 0)} / ${c.goalValue}`}</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: done ? "var(--primary)" : "linear-gradient(90deg, var(--primary), var(--accent))" }} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
