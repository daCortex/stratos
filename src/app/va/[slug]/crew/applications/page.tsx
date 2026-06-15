import { getOrgBySlug, getAppForm, listApplications } from "@/lib/store";
import AppFormBuilder from "@/components/AppFormBuilder";
import { reviewApplicationAction } from "../actions";

export default async function CrewApplications({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const form = await getAppForm(org.id);
  const apps = await listApplications(org.id);
  const qLabel = (id: string) => form.questions.find((q) => q.id === id)?.label || id;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }} className="news-grid">
      <AppFormBuilder slug={slug} form={form} />

      <div>
        <h3 style={{ marginTop: 0 }}>Submitted applications <span className="faint">({apps.filter((a) => a.status === "pending").length} pending)</span></h3>
        {apps.length === 0 ? <p className="muted">No applications yet.</p> : (
          <div style={{ display: "grid", gap: 10 }}>
            {apps.map((a) => (
              <div key={a.id} className="card" style={{ padding: "1.1rem 1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>{a.ifcUsername} {a.score != null && <span className="pill" style={{ fontSize: "0.62rem", color: a.score >= form.passScore ? "var(--primary)" : "#e0556a", borderColor: "currentColor" }}>Quiz {a.score}%</span>}</div>
                  <span className="pill" style={{ fontSize: "0.62rem", textTransform: "capitalize" }}>{a.status}</span>
                </div>
                <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                  {Object.entries(a.answers).map(([k, v]) => (
                    <div key={k} style={{ fontSize: "0.84rem" }}><span className="faint">{qLabel(k)}: </span><span className="muted">{v}</span></div>
                  ))}
                </div>
                {a.status === "pending" && (
                  <form action={reviewApplicationAction.bind(null, slug)} style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <input type="hidden" name="id" value={a.id} />
                    <button name="decision" value="accept" className="btn btn-primary btn-sm" type="submit">Accept &amp; add to roster</button>
                    <button name="decision" value="reject" className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Reject</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
