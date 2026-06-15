import { getOrgBySlug, listMembers, memberStats } from "@/lib/store";
import { rankForHours } from "@/lib/ranks";

export default async function RosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const members = (await listMembers(org.id)).filter((m) => m.status === "active");
  const rows = await Promise.all(members.map(async (m) => {
    const s = await memberStats(m);
    const rank = m.rankLabel || rankForHours(org.ranks, s.minutes / 60).label;
    return { m, hours: s.minutes / 60, rank };
  }));
  rows.sort((a, b) => b.hours - a.hours);

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 860 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Crew</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Pilot roster</h1>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data">
          <thead><tr><th>Callsign</th><th>Pilot</th><th>Rank</th><th style={{ textAlign: "right" }}>Hours</th></tr></thead>
          <tbody>
            {rows.map(({ m, hours, rank }) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.callsign}</td>
                <td className="muted">{m.ifUsername || "—"}</td>
                <td>{rank}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{Math.floor(hours)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
