import { getOrgBySlug, listNews } from "@/lib/store";

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const news = await listNews(org.id);
  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 760 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Flight deck</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>News &amp; announcements</h1>
      {news.length === 0 ? <p className="muted">No posts yet.</p> : (
        <div style={{ display: "grid", gap: 14 }}>
          {news.map((n) => (
            <article key={n.id} className="card" style={{ padding: "1.5rem" }}>
              {n.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={n.imageUrl} alt="" style={{ width: "100%", borderRadius: "calc(var(--radius) - 4px)", marginBottom: 14, objectFit: "cover", maxHeight: 240 }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>{n.category}</span>
                <span className="faint" style={{ fontSize: "0.78rem" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 style={{ fontSize: "1.3rem", margin: "0.7rem 0 0.4rem" }}>{n.title}</h2>
              <p className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{n.body}</p>
              <div className="faint" style={{ fontSize: "0.78rem", marginTop: 12 }}>— {n.author}</div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
