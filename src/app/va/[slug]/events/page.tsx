import { getOrgBySlug, listEvents, getMembership } from "@/lib/store";
import { currentUser } from "@/lib/auth";
import { airportLatLon } from "@/lib/airports";
import { eventSignupAction } from "../pilot/actions";
import FlightMap from "@/components/FlightMap";

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const events = await listEvents(org.id);
  const user = await currentUser();
  const m = user ? await getMembership(org.id, user.id) : null;

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 860 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Community</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>Events</h1>
      {events.length === 0 ? <p className="muted">No upcoming events. Check back soon.</p> : (
        <div style={{ display: "grid", gap: 16 }}>
          {events.map((e) => {
            const a = airportLatLon(e.dep), b = airportLatLon(e.arr);
            const signed = m ? e.signups.includes(m.id) : false;
            return (
              <div key={e.id} className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>{new Date(e.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}Z</span>
                      {e.bonusCode && <span className="pill" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>Bonus {e.bonusCode}</span>}
                    </div>
                    <h2 style={{ fontSize: "1.4rem", margin: "10px 0 4px" }}>{e.title}</h2>
                    <div className="muted">{e.dep} → {e.arr} · {e.aircraft} · {e.server} Server</div>
                    <p className="muted" style={{ fontSize: "0.92rem" }}>{e.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      <span className="faint" style={{ fontSize: "0.85rem" }}>{e.signups.length} signed up</span>
                      {m && (
                        <form action={eventSignupAction.bind(null, slug)}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <button className={`btn btn-sm ${signed ? "btn-ghost" : "btn-primary"}`} type="submit">{signed ? "Cancel signup" : "Sign up"}</button>
                        </form>
                      )}
                    </div>
                  </div>
                  {a && b && <div style={{ width: 260, flexShrink: 0 }}><FlightMap routes={[{ from: a, to: b }]} markers={[{ at: a, label: e.dep, kind: "hub" }, { at: b, label: e.arr, kind: "dest" }]} height={160} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
