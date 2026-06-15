import { getOrgBySlug, listNotams } from "@/lib/store";

const sev: Record<string, { c: string; l: string }> = {
  info: { c: "var(--accent)", l: "INFO" },
  advisory: { c: "var(--primary)", l: "ADVISORY" },
  urgent: { c: "#e0556a", l: "URGENT" },
};

export default async function NotamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const notams = await listNotams(org.id);
  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 760 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Notices</span>
      <h1 style={{ fontSize: "2rem", margin: "6px 0 24px" }}>NOTAMs</h1>
      {notams.length === 0 ? <p className="muted">No active notices.</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {notams.map((n) => {
            const s = sev[n.severity] || sev.info;
            return (
              <div key={n.id} className="card" style={{ padding: "1.3rem", borderLeft: `3px solid ${s.c}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pill" style={{ color: s.c, borderColor: s.c, fontSize: "0.66rem" }}>{s.l}</span>
                  <span className="faint" style={{ fontSize: "0.78rem" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 style={{ fontSize: "1.15rem", margin: "8px 0 4px" }}>{n.title}</h2>
                <p className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{n.body}</p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
