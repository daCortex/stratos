import { getOrgBySlug, listRoutes } from "@/lib/store";
import { airportLatLon } from "@/lib/airports";
import FlightMap, { type MapRoute, type MapMarker } from "@/components/FlightMap";

function simbrief(dep: string, arr: string, ac: string) {
  return `https://dispatch.simbrief.com/options/custom?orig=${dep}&dest=${arr}&type=${encodeURIComponent(ac)}`;
}

export default async function RoutesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const routes = await listRoutes(org.id);
  const featured = routes.find((r) => r.featured);

  const mapRoutes: MapRoute[] = [];
  const marks: Record<string, MapMarker> = {};
  for (const r of routes) {
    const a = airportLatLon(r.dep), b = airportLatLon(r.arr);
    if (a && b) mapRoutes.push({ from: a, to: b });
    if (a) marks[r.dep] = { at: a, label: r.dep, kind: org.hubs.some((h) => h.icao === r.dep) ? "hub" : "dest" };
    if (b) marks[r.arr] = { at: b, label: r.arr, kind: org.hubs.some((h) => h.icao === r.arr) ? "hub" : "dest" };
  }

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Operations</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Route network</h1>

      {featured && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: 20, borderColor: "var(--primary)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>★ Route of the Week</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-head)", marginTop: 8 }}>{featured.dep} → {featured.arr}</div>
            <div className="muted">{featured.flightNo} · {featured.aircraft} · {Math.floor(featured.durationMin / 60)}h {featured.durationMin % 60}m</div>
          </div>
          {org.settings.simbrief && <a href={simbrief(featured.dep, featured.arr, featured.aircraft)} target="_blank" rel="noreferrer" className="btn btn-primary">Generate SimBrief OFP ↗</a>}
        </div>
      )}

      <div style={{ marginBottom: 24 }}><FlightMap routes={mapRoutes} markers={Object.values(marks)} height={380} /></div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data">
          <thead><tr><th>Flight</th><th>From</th><th>To</th><th>Aircraft</th><th>Time</th>{org.settings.simbrief && <th>Briefing</th>}</tr></thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.flightNo}{r.featured && <span style={{ color: "var(--primary)" }}> ★</span>}</td>
                <td>{r.dep}</td><td>{r.arr}</td>
                <td className="muted">{r.aircraft}</td>
                <td>{Math.floor(r.durationMin / 60)}h {r.durationMin % 60}m</td>
                {org.settings.simbrief && <td><a href={simbrief(r.dep, r.arr, r.aircraft)} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>SimBrief ↗</a></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {routes.length === 0 && <p className="muted" style={{ padding: "1.4rem", textAlign: "center" }}>No routes published yet.</p>}
      </div>
    </main>
  );
}
