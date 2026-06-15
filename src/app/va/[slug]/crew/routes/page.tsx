import { getOrgBySlug, listRoutes } from "@/lib/store";
import { addRouteAction, deleteRouteAction, featureRouteAction } from "../actions";

export default async function CrewRoutes({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const routes = await listRoutes(org.id);
  return (
    <>
      <form action={addRouteAction.bind(null, slug)} className="card" style={{ padding: "1.2rem", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
        <div><label className="label">Flight no.</label><input name="flightNo" className="input" placeholder="SKY100" style={{ width: 110 }} required /></div>
        <div><label className="label">From</label><input name="dep" className="input" placeholder="EGLL" maxLength={4} style={{ width: 80 }} required /></div>
        <div><label className="label">To</label><input name="arr" className="input" placeholder="LFPG" maxLength={4} style={{ width: 80 }} required /></div>
        <div><label className="label">Aircraft</label><input name="aircraft" className="input" placeholder="A320neo" style={{ width: 110 }} /></div>
        <div><label className="label">Hours</label><input name="hours" type="number" step="0.1" className="input" style={{ width: 80 }} /></div>
        <button className="btn btn-primary btn-sm" type="submit">Add route</button>
      </form>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data">
          <thead><tr><th>Flight</th><th>Route</th><th>Aircraft</th><th>Time</th><th>Featured</th><th></th></tr></thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.flightNo}</td>
                <td>{r.dep} → {r.arr}</td>
                <td className="muted">{r.aircraft}</td>
                <td>{Math.floor(r.durationMin / 60)}h {r.durationMin % 60}m</td>
                <td>
                  <form action={featureRouteAction.bind(null, slug)}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost btn-sm" type="submit" style={{ color: r.featured ? "var(--primary)" : "var(--text-faint)" }}>{r.featured ? "★ Featured" : "☆ Feature"}</button>
                  </form>
                </td>
                <td>
                  <form action={deleteRouteAction.bind(null, slug)}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>✕</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {routes.length === 0 && <p className="muted" style={{ padding: "1.2rem", textAlign: "center" }}>No routes yet.</p>}
      </div>
    </>
  );
}
