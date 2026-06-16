import { notFound } from "next/navigation";
import { getOrgBySlug, listMembers } from "@/lib/store";
import { orgModules } from "@/lib/theme";
import { liveFlights, ifConfigured } from "@/lib/infiniteflight";
import FlightMap, { type MapMarker } from "@/components/FlightMap";

export const dynamic = "force-dynamic";

export default async function LivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  if (!orgModules(org.settings).liveMap) notFound();

  const members = await listMembers(org.id);
  const memberByIfc = new Map(members.filter((m) => m.ifUsername).map((m) => [m.ifUsername!.toLowerCase(), m]));
  const flights = await liveFlights();
  const ours = flights.filter((f) => f.username && memberByIfc.has(f.username.toLowerCase()));

  const markers: MapMarker[] = ours.map((f) => {
    const m = memberByIfc.get(f.username!.toLowerCase())!;
    return { at: [f.latitude, f.longitude] as [number, number], label: `${m.callsign} · ${f.callsign} · ${Math.round(f.altitude)}ft · ${Math.round(f.speed)}kts`, kind: "plane" as const };
  });

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Operations</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 6px" }}>Live flights</h1>
      <p className="muted">{!ifConfigured ? "Live tracking turns on once an Infinite Flight API key is configured." : ours.length === 0 ? "None of your pilots are airborne right now." : `${ours.length} of your pilots airborne now.`}</p>

      <div style={{ marginTop: 18 }}>
        <FlightMap markers={markers} height={460} />
      </div>

      {ours.length > 0 && (
        <div className="card" style={{ overflow: "hidden", marginTop: 18 }}>
          <table className="data">
            <thead><tr><th>Pilot</th><th>Callsign</th><th>Altitude</th><th>Speed</th><th>Server</th></tr></thead>
            <tbody>
              {ours.map((f) => {
                const m = memberByIfc.get(f.username!.toLowerCase())!;
                return (
                  <tr key={f.flightId}>
                    <td style={{ fontWeight: 600 }}>{m.callsign}</td>
                    <td className="muted">{f.callsign}</td>
                    <td>{f.altitude.toLocaleString()} ft</td>
                    <td>{f.speed} kts</td>
                    <td className="muted">{f.server}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
