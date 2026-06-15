import { getOrgBySlug, listNews } from "@/lib/store";
import { postNewsAction, deleteNewsAction } from "../actions";

export default async function CrewNews({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const news = await listNews(org.id);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 18, alignItems: "start" }} className="news-grid">
      <form action={postNewsAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Post an announcement</h3>
        <input name="title" className="input" placeholder="Title" required />
        <select name="category" className="input"><option>Announcement</option><option>Event</option><option>Route</option><option>Update</option><option>Promotion</option></select>
        <input name="imageUrl" className="input" placeholder="Banner image URL (optional)" />
        <textarea name="body" className="input" rows={5} placeholder="Write your update…" required />
        <button className="btn btn-primary btn-sm" type="submit">Publish</button>
      </form>
      <div style={{ display: "grid", gap: 10 }}>
        {news.length === 0 ? <p className="muted">No posts yet.</p> : news.map((n) => (
          <div key={n.id} className="card" style={{ padding: "1.1rem 1.3rem", display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", fontSize: "0.66rem" }}>{n.category}</span>
              <div style={{ fontWeight: 600, marginTop: 6 }}>{n.title}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{n.body.slice(0, 140)}{n.body.length > 140 ? "…" : ""}</div>
              <div className="faint" style={{ fontSize: "0.74rem", marginTop: 6 }}>{n.author} · {new Date(n.createdAt).toLocaleDateString()}</div>
            </div>
            <form action={deleteNewsAction.bind(null, slug)}>
              <input type="hidden" name="id" value={n.id} />
              <button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
