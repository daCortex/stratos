import { notFound } from "next/navigation";
import { getOrgBySlug, listMembers, listPireps, memberStats, getMembershipById } from "@/lib/store";
import { orgModules } from "@/lib/theme";

function monthKey(iso: string) { return iso.slice(0, 7); } // YYYY-MM

function Bars({ data, color = "var(--primary)", unit = "" }: { data: [string, number][]; color?: string; unit?: string }) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 150, paddingTop: 10 }}>
      {data.map(([label, v]) => (
        <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600 }}>{v}{unit}</div>
          <div title={`${label}: ${v}`} style={{ width: "100%", maxWidth: 38, height: `${(v / max) * 110}px`, minHeight: v ? 3 : 0, background: color, borderRadius: "6px 6px 0 0" }} />
          <div className="faint" style={{ fontSize: "0.66rem", whiteSpace: "nowrap" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  if (!orgModules(org.settings).analytics) notFound();

  const members = await listMembers(org.id);
  const pireps = await listPireps(org.id);
  const approved = pireps.filter((p) => p.status === "approved");

  // last 6 months keys
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(d.toISOString().slice(0, 7)); }
  const mLabel = (k: string) => new Date(k + "-01").toLocaleDateString("en-US", { month: "short" });

  // flights per month
  const flightsByMonth = months.map((k) => [mLabel(k), approved.filter((p) => monthKey(p.filedAt) === k).length] as [string, number]);
  // joins per month
  const joinsByMonth = months.map((k) => [mLabel(k), members.filter((m) => monthKey(m.joinedAt) === k).length] as [string, number]);

  // top routes
  const routeCounts = new Map<string, number>();
  for (const p of approved) { const key = `${p.dep}→${p.arr}`; routeCounts.set(key, (routeCounts.get(key) || 0) + 1); }
  const topRoutes = [...routeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // top pilots by hours
  const pilotHours = await Promise.all(members.map(async (m) => ({ m, mins: (await memberStats(m)).minutes })));
  pilotHours.sort((a, b) => b.mins - a.mins);
  const topPilots = pilotHours.slice(0, 6);

  const statusBreak: [string, number][] = [
    ["Approved", pireps.filter((p) => p.status === "approved").length],
    ["Pending", pireps.filter((p) => p.status === "pending").length],
    ["Rejected", pireps.filter((p) => p.status === "rejected").length],
  ];

  const card: React.CSSProperties = { padding: "1.3rem" };

  return (
    <>
      <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>Analytics</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div className="card" style={card}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Flights per month</h3>
          <Bars data={flightsByMonth} />
        </div>
        <div className="card" style={card}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>New pilots per month</h3>
          <Bars data={joinsByMonth} color="var(--accent)" />
        </div>
        <div className="card" style={card}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>PIREP status</h3>
          <Bars data={statusBreak} />
        </div>
        <div className="card" style={card}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Top routes</h3>
          {topRoutes.length === 0 ? <p className="faint">No flights yet.</p> : topRoutes.map(([r, c]) => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}><span>{r}</span><b>{c}</b></div>
          ))}
        </div>
        <div className="card" style={card}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Top pilots</h3>
          {topPilots.map(({ m, mins }) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}><span>{m.callsign}</span><b>{Math.floor(mins / 60)}h</b></div>
          ))}
        </div>
        <div className="card" style={card}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>At a glance</h3>
          {[["Pilots", members.filter((m) => m.status === "active").length], ["Total flights", approved.length], ["Hours flown", Math.round(pilotHours.reduce((s, p) => s + p.mins, 0) / 60)], ["IF-verified pilots", members.filter((m) => m.ifVerified).length]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}><span className="muted">{l}</span><b>{v.toLocaleString()}</b></div>
          ))}
        </div>
      </div>
    </>
  );
}
