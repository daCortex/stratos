import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getOrgBySlug, getMembership, listPireps, memberStats, pointsBalance, earnedFor,
  listAwards, listNotifications, listChallenges, challengeProgressFor, listRoutes,
} from "@/lib/store";
import { currentUser } from "@/lib/auth";
import { rankForHours, nextRank, rankProgress } from "@/lib/ranks";
import FilePirepForm from "@/components/FilePirepForm";
import { markReadAction } from "./actions";

export default async function PilotHub({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ filed?: string }> }) {
  const { slug } = await params;
  const { filed } = await searchParams;
  const org = (await getOrgBySlug(slug))!;
  const base = `/va/${org.slug}`;
  const user = await currentUser();
  if (!user) redirect(`/login?next=${base}/pilot`);
  const m = await getMembership(org.id, user!.id);
  if (!m) redirect(`${base}/join`);

  const stats = await memberStats(m!);
  const hours = stats.minutes / 60;
  const rank = m!.rankLabel ? { label: m!.rankLabel } : rankForHours(org.ranks, hours);
  const nxt = nextRank(org.ranks, hours);
  const progress = rankProgress(org.ranks, hours);
  const myPireps = await listPireps(org.id, { membershipId: m!.id });
  const pending = myPireps.filter((p) => p.status === "pending").length;
  const balance = await pointsBalance(m!.id);
  const earned = await earnedFor(m!.id);
  const allAwards = await listAwards(org.id);
  const myAwards = allAwards.filter((a) => earned.some((e) => e.awardId === a.id));
  const notifs = (await listNotifications(m!.id)).slice(0, 6);
  const unread = notifs.filter((n) => !n.read).length;
  const challenges = (await listChallenges(org.id)).filter((c) => c.active);
  const cProg = await challengeProgressFor(m!.id);
  const featuredRoute = (await listRoutes(org.id)).find((r) => r.featured);
  const cur = org.settings.currency;

  if (m!.status === "pending") {
    return (
      <main className="container-x" style={{ paddingTop: 60, paddingBottom: 80, maxWidth: 560 }}>
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem" }}>Application received</h1>
          <p className="muted">Your request to join {org.name} is pending staff approval. You'll be able to file once you're accepted.</p>
        </div>
      </main>
    );
  }

  const cards = [
    [rank.label, "Current rank"],
    [`${Math.floor(hours)}h`, "Logged hours"],
    [stats.pireps, "Flights"],
    [balance.toLocaleString(), cur],
    [pending, "Pending review"],
  ] as const;

  return (
    <main className="container-x" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>Flight deck · {m!.callsign}</span>
          <h1 style={{ fontSize: "1.9rem", margin: "4px 0 0" }}>{user!.displayName}</h1>
        </div>
        <Link href={`${base}/leaderboard`} className="btn btn-ghost btn-sm">Leaderboard</Link>
      </div>

      {filed && <p className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", marginTop: 14 }}>✓ PIREP filed.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 18 }}>
        {cards.map(([v, l], i) => (
          <div key={i} className="card" style={{ padding: "1.1rem 1.2rem" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-head)" }}>{v}</div>
            <div className="faint" style={{ fontSize: "0.78rem" }}>{l}</div>
          </div>
        ))}
      </div>

      {nxt && (
        <div className="card" style={{ padding: "1.1rem 1.3rem", marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
            <span className="muted">Progress to <b style={{ color: "var(--text)" }}>{nxt.label}</b></span>
            <span className="faint">{Math.max(0, Math.round(nxt.hours - hours))}h to go</span>
          </div>
          <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, var(--primary), var(--accent))" }} />
          </div>
        </div>
      )}

      {/* engagement widgets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 14 }}>
        {notifs.length > 0 && (
          <div className="card" style={{ padding: "1.1rem 1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Notifications {unread > 0 && <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", fontSize: "0.62rem" }}>{unread} new</span>}</h3>
              {unread > 0 && <form action={markReadAction.bind(null, slug)}><button className="btn btn-ghost btn-sm" type="submit" style={{ fontSize: "0.72rem" }}>Mark read</button></form>}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "grid", gap: 8 }}>
              {notifs.map((n) => (
                <li key={n.id} style={{ fontSize: "0.84rem", opacity: n.read ? 0.6 : 1, display: "flex", gap: 6 }}>
                  <span style={{ color: "var(--primary)" }}>•</span><span className="muted">{n.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card" style={{ padding: "1.1rem 1.2rem" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>Your badges <span className="faint" style={{ fontSize: "0.8rem" }}>({myAwards.length}/{allAwards.length})</span></h3>
          {myAwards.length === 0 ? <p className="faint" style={{ fontSize: "0.84rem", margin: 0 }}>Fly to start earning awards.</p> : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {myAwards.map((a) => <span key={a.id} title={a.name} style={{ fontSize: "1.8rem" }}>{a.icon}</span>)}
            </div>
          )}
          <Link href={`${base}/awards`} className="faint" style={{ fontSize: "0.78rem", display: "inline-block", marginTop: 10 }}>View all awards →</Link>
        </div>

        {challenges.length > 0 && (
          <div className="card" style={{ padding: "1.1rem 1.2rem" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>Active challenges</h3>
            {challenges.slice(0, 2).map((c) => {
              const p = cProg.find((x) => x.challengeId === c.id);
              const pct = Math.min(100, Math.round(((p?.progress || 0) / c.goalValue) * 100));
              return (
                <div key={c.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}><span>{c.title}</span><span className="faint">{pct}%</span></div>
                  <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)" }} /></div>
                </div>
              );
            })}
            <Link href={`${base}/challenges`} className="faint" style={{ fontSize: "0.78rem" }}>All challenges →</Link>
          </div>
        )}

        {featuredRoute && (
          <div className="card" style={{ padding: "1.1rem 1.2rem" }}>
            <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", fontSize: "0.62rem" }}>★ Route of the Week</span>
            <div style={{ fontWeight: 700, fontSize: "1.2rem", marginTop: 8 }}>{featuredRoute.dep} → {featuredRoute.arr}</div>
            <div className="faint" style={{ fontSize: "0.82rem" }}>{featuredRoute.flightNo} · {featuredRoute.aircraft}</div>
            <Link href={`${base}/routes`} className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>Open routes</Link>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 360px)", gap: 20, marginTop: 28, alignItems: "start" }} className="pilot-grid">
        <div>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>File a flight report</h2>
          <FilePirepForm org={org} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Your logbook</h2>
          <div className="card" style={{ overflow: "hidden" }}>
            {myPireps.length === 0 ? (
              <p className="muted" style={{ padding: "1.4rem", margin: 0, textAlign: "center" }}>No flights yet — file your first above.</p>
            ) : (
              <table className="data">
                <thead><tr><th>Flight</th><th>Route</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {myPireps.slice(0, 12).map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.flightNo}</td>
                      <td className="muted">{p.dep}→{p.arr}</td>
                      <td>{Math.floor(p.minutes / 60)}h{p.minutes % 60}m{p.multiplier !== 1 && <span className="faint"> ×{p.multiplier}</span>}</td>
                      <td><span className="pill" style={{ fontSize: "0.66rem", borderColor: p.status === "approved" ? "var(--primary)" : p.status === "rejected" ? "#e0556a" : "var(--border)", color: p.status === "approved" ? "var(--primary)" : p.status === "rejected" ? "#e0556a" : "var(--text-dim)" }}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
