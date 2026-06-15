import { getOrgBySlug, listAwards } from "@/lib/store";
import { addAwardAction, deleteAwardAction } from "../actions";

export default async function CrewAwards({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const awards = await listAwards(org.id);
  return (
    <>
      <form action={addAwardAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
        <div><label className="label">Icon</label><input name="icon" className="input" placeholder="🏅" style={{ width: 60 }} /></div>
        <div><label className="label">Name</label><input name="name" className="input" placeholder="Award name" required /></div>
        <div style={{ flex: 1, minWidth: 160 }}><label className="label">Description</label><input name="description" className="input" placeholder="How it's earned" /></div>
        <div><label className="label">Auto-grant</label>
          <select name="trigger" className="input" style={{ width: 110 }}><option value="manual">Manual</option><option value="hours">Hours ≥</option><option value="pireps">PIREPs ≥</option><option value="points">Points ≥</option></select>
        </div>
        <div><label className="label">Threshold</label><input name="threshold" type="number" className="input" style={{ width: 90 }} defaultValue={0} /></div>
        <div><label className="label">Colour</label><input name="color" type="color" className="input" defaultValue="#C9A84C" style={{ width: 54, padding: 3 }} /></div>
        <button className="btn btn-primary btn-sm" type="submit">Add award</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {awards.map((a) => (
          <div key={a.id} className="card" style={{ padding: "1.1rem", textAlign: "center", borderColor: a.color }}>
            <div style={{ fontSize: "2rem" }}>{a.icon}</div>
            <div style={{ fontWeight: 700, color: a.color }}>{a.name}</div>
            <div className="faint" style={{ fontSize: "0.78rem" }}>{a.description}</div>
            <div className="faint" style={{ fontSize: "0.72rem", marginTop: 6 }}>{a.trigger === "manual" ? "Manual" : `Auto · ${a.trigger} ≥ ${a.threshold}`}</div>
            <form action={deleteAwardAction.bind(null, slug)} style={{ marginTop: 8 }}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button></form>
          </div>
        ))}
        {awards.length === 0 && <p className="muted">No awards defined.</p>}
      </div>
    </>
  );
}
