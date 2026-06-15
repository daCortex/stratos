import { getOrgBySlug, listNotams } from "@/lib/store";
import { addNotamAction, deleteNotamAction } from "../actions";

export default async function CrewNotams({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const notams = await listNotams(org.id);
  return (
    <>
      <form action={addNotamAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "grid", gap: 10, marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>Publish a NOTAM</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input name="title" className="input" placeholder="Notice title" style={{ flex: 1 }} required />
          <select name="severity" className="input" style={{ width: 130 }}><option value="info">Info</option><option value="advisory">Advisory</option><option value="urgent">Urgent</option></select>
        </div>
        <textarea name="body" className="input" rows={3} placeholder="Notice text" required />
        <button className="btn btn-primary btn-sm" type="submit" style={{ justifySelf: "start" }}>Publish</button>
      </form>
      <div style={{ display: "grid", gap: 10 }}>
        {notams.map((n) => (
          <div key={n.id} className="card" style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div><div style={{ fontWeight: 600 }}>{n.title} <span className="pill" style={{ fontSize: "0.62rem", textTransform: "uppercase" }}>{n.severity}</span></div><div className="faint" style={{ fontSize: "0.82rem" }}>{n.body.slice(0, 90)}</div></div>
            <form action={deleteNotamAction.bind(null, slug)}><input type="hidden" name="id" value={n.id} /><button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button></form>
          </div>
        ))}
        {notams.length === 0 && <p className="muted">No notices.</p>}
      </div>
    </>
  );
}
