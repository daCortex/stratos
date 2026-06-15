import { getOrgBySlug, listPireps, getMembershipById } from "@/lib/store";
import { reviewPirepAction } from "../actions";

export default async function CrewPireps({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const all = await listPireps(org.id);
  const pending = all.filter((p) => p.status === "pending");
  const recent = all.filter((p) => p.status !== "pending").slice(0, 20);

  const withName = async (id: number) => (await getMembershipById(id))?.callsign || "—";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Review queue <span className="faint" style={{ fontSize: "1rem" }}>({pending.length})</span></h2>
        <a href={`/va/${slug}/crew/export?type=pireps`} className="btn btn-ghost btn-sm">Export PIREPs CSV ↓</a>
      </div>

      {pending.length === 0 ? <p className="muted" style={{ marginTop: 14 }}>Nothing to review. ✓</p> : (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {await Promise.all(pending.map(async (p) => (
            <div key={p.id} className="card" style={{ padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 600 }}>{p.flightNo} · <span className="muted">{await withName(p.membershipId)}</span></div>
                <div className="faint" style={{ fontSize: "0.84rem" }}>{p.dep} → {p.arr} · {p.aircraft} · {Math.floor(p.minutes / 60)}h {p.minutes % 60}m {p.multiplier !== 1 && `(×${p.multiplier})`} · {p.server}</div>
                {p.remarks && <div className="muted" style={{ fontSize: "0.84rem", marginTop: 4 }}>“{p.remarks}”</div>}
              </div>
              <form action={reviewPirepAction.bind(null, slug)} style={{ display: "flex", gap: 6 }}>
                <input type="hidden" name="id" value={p.id} />
                <button name="decision" value="approve" className="btn btn-primary btn-sm" type="submit">Approve</button>
                <button name="decision" value="reject" className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Reject</button>
              </form>
            </div>
          )))}
        </div>
      )}

      <h3 style={{ marginTop: 28 }}>Recently reviewed</h3>
      <div className="card" style={{ overflow: "hidden", marginTop: 10 }}>
        <table className="data">
          <thead><tr><th>Flight</th><th>Pilot</th><th>Route</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            {await Promise.all(recent.map(async (p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.flightNo}</td>
                <td className="muted">{await withName(p.membershipId)}</td>
                <td className="muted">{p.dep}→{p.arr}</td>
                <td>{Math.floor(p.minutes / 60)}h</td>
                <td><span className="pill" style={{ fontSize: "0.66rem", color: p.status === "approved" ? "var(--primary)" : "#e0556a", borderColor: "currentColor" }}>{p.status}</span></td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </>
  );
}
