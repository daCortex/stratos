import { getOrgBySlug, listEvents } from "@/lib/store";
import { addEventAction, deleteEventAction } from "../actions";

export default async function CrewEvents({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const events = await listEvents(org.id);
  return (
    <>
      <form action={addEventAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "grid", gap: 10, marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>Create an event</h3>
        <input name="title" className="input" placeholder="Event title" required />
        <textarea name="description" className="input" rows={2} placeholder="Description" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="dep" className="input" placeholder="From ICAO" maxLength={4} style={{ width: 110 }} />
          <input name="arr" className="input" placeholder="To ICAO" maxLength={4} style={{ width: 110 }} />
          <input name="aircraft" className="input" placeholder="Aircraft" style={{ width: 120 }} />
          <select name="server" className="input" style={{ width: 120 }}><option>Expert</option><option>Training</option><option>Casual</option></select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label className="label">Start (UTC)</label><input name="startAt" type="datetime-local" className="input" required /></div>
          <div><label className="label">Bonus code</label><input name="bonusCode" className="input" placeholder="EVENT" style={{ width: 110 }} /></div>
          <button className="btn btn-primary btn-sm" type="submit">Post event</button>
        </div>
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {events.map((e) => (
          <div key={e.id} className="card" style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div className="faint" style={{ fontSize: "0.82rem" }}>{e.dep} → {e.arr} · {new Date(e.startAt).toLocaleString()} · {e.signups.length} signed up</div>
            </div>
            <form action={deleteEventAction.bind(null, slug)}><input type="hidden" name="id" value={e.id} /><button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button></form>
          </div>
        ))}
        {events.length === 0 && <p className="muted">No events yet.</p>}
      </div>
    </>
  );
}
