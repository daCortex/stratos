import { getOrgBySlug, listMembers, memberStats } from "@/lib/store";

export default async function LeaderboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const members = (await listMembers(org.id)).filter((m) => m.status === "active");
  const rows = await Promise.all(members.map(async (m) => ({ m, ...(await memberStats(m)) })));
  rows.sort((a, b) => b.minutes - a.minutes);
  const medal = ["🥇", "🥈", "🥉"];

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 760 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Standings</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Leaderboard</h1>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data">
          <thead><tr><th>#</th><th>Pilot</th><th style={{ textAlign: "right" }}>Flights</th><th style={{ textAlign: "right" }}>Hours</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.m.id}>
                <td style={{ fontWeight: 700, width: 44 }}>{medal[i] || i + 1}</td>
                <td><b>{r.m.callsign}</b> <span className="faint">{r.m.ifUsername}</span></td>
                <td style={{ textAlign: "right" }} className="muted">{r.pireps}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{Math.floor(r.minutes / 60)}h {r.minutes % 60}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
