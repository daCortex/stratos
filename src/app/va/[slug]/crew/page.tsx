import Link from "next/link";
import { getOrgBySlug, listMembers, listPireps, memberStats } from "@/lib/store";

export default async function CrewDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const members = await listMembers(org.id);
  const pireps = await listPireps(org.id);
  const pending = pireps.filter((p) => p.status === "pending");
  const pendingPilots = members.filter((m) => m.status === "pending");
  let totalMin = 0;
  for (const m of members) totalMin += (await memberStats(m)).minutes;

  const cards = [
    [members.filter((m) => m.status === "active").length, "Active pilots", `${slug}/crew/pilots`],
    [pendingPilots.length, "Pending applications", `${slug}/crew/pilots`],
    [pending.length, "PIREPs to review", `${slug}/crew/pireps`],
    [Math.round(totalMin / 60).toLocaleString(), "Hours flown", `${slug}/crew/pireps`],
  ] as const;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
        {cards.map(([v, l, href], i) => (
          <Link key={i} href={`/${href}`} className="card" style={{ padding: "1.3rem", display: "block" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-head)" }} className="gradient-text">{v}</div>
            <div className="faint" style={{ fontSize: "0.82rem", marginTop: 2 }}>{l}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 24 }}>
        <div className="card" style={{ padding: "1.3rem" }}>
          <h3 style={{ marginTop: 0 }}>Awaiting review</h3>
          {pending.length === 0 ? <p className="faint">No PIREPs in the queue. ✓</p> : (
            <ul className="muted" style={{ paddingLeft: 16, margin: 0 }}>
              {pending.slice(0, 5).map((p) => <li key={p.id}>{p.flightNo} · {p.dep}→{p.arr} · {Math.floor(p.minutes / 60)}h</li>)}
            </ul>
          )}
          <Link href={`/va/${slug}/crew/pireps`} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Open queue</Link>
        </div>
        <div className="card" style={{ padding: "1.3rem" }}>
          <h3 style={{ marginTop: 0 }}>New applications</h3>
          {pendingPilots.length === 0 ? <p className="faint">No pending pilots.</p> : (
            <ul className="muted" style={{ paddingLeft: 16, margin: 0 }}>
              {pendingPilots.slice(0, 5).map((m) => <li key={m.id}>{m.callsign} · {m.ifUsername}</li>)}
            </ul>
          )}
          <Link href={`/va/${slug}/crew/pilots`} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Manage roster</Link>
        </div>
      </div>
    </>
  );
}
