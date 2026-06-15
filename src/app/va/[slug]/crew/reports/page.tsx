import { getOrgBySlug, listReports } from "@/lib/store";
import { resolveReportAction } from "../actions";

export default async function CrewReports({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const reports = await listReports(org.id);
  const open = reports.filter((r) => r.status === "open");
  const closed = reports.filter((r) => r.status !== "open");

  return (
    <>
      <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>Reports <span className="faint" style={{ fontSize: "1rem" }}>({open.length} open)</span></h2>
      {reports.length === 0 ? <p className="muted">No reports filed. A quiet flight deck is a happy one.</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {[...open, ...closed].map((r) => (
            <div key={r.id} className="card" style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <span className="pill" style={{ fontSize: "0.66rem", textTransform: "capitalize" }}>{r.category}</span>
                <div style={{ marginTop: 6 }}>{r.message}</div>
                <div className="faint" style={{ fontSize: "0.8rem", marginTop: 2 }}>{r.reporterName || "Anonymous"}{r.target ? ` → ${r.target}` : ""} · <span style={{ textTransform: "capitalize" }}>{r.status}</span></div>
              </div>
              {r.status === "open" && (
                <form action={resolveReportAction.bind(null, slug)} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="id" value={r.id} />
                  <button name="decision" value="resolve" className="btn btn-primary btn-sm">Resolve</button>
                  <button name="decision" value="dismiss" className="btn btn-ghost btn-sm">Dismiss</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
