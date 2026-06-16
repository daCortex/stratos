import PlatformHeader from "@/components/PlatformHeader";
import { currentUser, isPlatformAdmin } from "@/lib/auth";
import { dbHealthy, listIncidents } from "@/lib/store";
import { postIncidentAction, resolveIncidentAction, deleteIncidentAction } from "./actions";
import type { Incident } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stratos — System status" };

const GREEN = "#3ecf8e", AMBER = "#e0a93c", RED = "#e0556a";
const impactColor: Record<string, string> = { maintenance: "#6aa6ff", minor: AMBER, major: "#e07b3c", critical: RED };

export default async function StatusPage() {
  const health = await dbHealthy();
  const incidents = await listIncidents();
  const active = incidents.filter((i) => !i.resolved);
  const user = await currentUser();
  const admin = isPlatformAdmin(user);

  const worst = active.reduce<string | null>((acc, i) => {
    const rank = ["maintenance", "minor", "major", "critical"];
    if (!acc) return i.impact;
    return rank.indexOf(i.impact) > rank.indexOf(acc) ? i.impact : acc;
  }, null);

  // Component checks
  const components = [
    { name: "Website", ok: true, note: "Pages serving normally" },
    { name: "Database", ok: health.ok, note: health.ok ? `Operational · ${health.mode}` : `Error: ${health.error}` },
    { name: "Authentication", ok: true, note: "Sign-in available" },
    { name: "Crew centers", ok: health.ok, note: health.ok ? "All VA sites online" : "Affected by database issue" },
  ];

  const allOk = components.every((c) => c.ok) && active.length === 0;
  const overall = !health.ok ? { c: RED, t: "Major outage" }
    : worst === "critical" || worst === "major" ? { c: RED, t: "Service disruption" }
    : worst ? { c: AMBER, t: worst === "maintenance" ? "Under maintenance" : "Degraded performance" }
    : { c: GREEN, t: "All systems operational" };

  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ maxWidth: 780, paddingTop: 40, paddingBottom: 80 }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>Status</span>
        <h1 style={{ fontSize: "1.9rem", margin: "4px 0 18px" }}>System status</h1>

        <div className="card" style={{ padding: "1.4rem 1.6rem", display: "flex", alignItems: "center", gap: 14, borderColor: overall.c }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: overall.c, boxShadow: `0 0 12px ${overall.c}` }} />
          <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "var(--font-head)" }}>{overall.t}</div>
          <span className="faint" style={{ marginLeft: "auto", fontSize: "0.82rem" }}>Live</span>
        </div>

        <div className="card" style={{ marginTop: 16, overflow: "hidden" }}>
          {components.map((c, i) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.4rem", borderTop: i ? "1px solid var(--border)" : "none" }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: c.ok ? GREEN : RED }} />
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div className="faint" style={{ marginLeft: "auto", fontSize: "0.84rem" }}>{c.ok ? "Operational" : "Disrupted"}</div>
            </div>
          ))}
        </div>
        <p className="faint" style={{ fontSize: "0.78rem", marginTop: 8 }}>Database: {components[1].note}</p>

        {/* active incidents */}
        {active.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.2rem", margin: "28px 0 12px" }}>Active incidents</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {active.map((it) => <IncidentCard key={it.id} it={it} admin={admin} />)}
            </div>
          </>
        )}

        {allOk && <p className="muted" style={{ marginTop: 24 }}>No incidents reported. Everything's running smoothly. ✓</p>}

        {/* admin: post an incident */}
        {admin && (
          <form action={postIncidentAction} className="card" style={{ padding: "1.4rem", marginTop: 24, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Post an incident <span className="faint" style={{ fontSize: "0.8rem", fontWeight: 400 }}>(admin)</span></h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="title" className="input" placeholder="What's going on?" required />
              <select name="impact" className="input" style={{ width: 150 }}>
                <option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option><option value="maintenance">Maintenance</option>
              </select>
            </div>
            <textarea name="body" className="input" rows={2} placeholder="Details for users (optional)" />
            <button className="btn btn-primary btn-sm" type="submit" style={{ justifySelf: "start" }}>Publish update</button>
          </form>
        )}

        {/* history */}
        {incidents.some((i) => i.resolved) && (
          <>
            <h2 style={{ fontSize: "1.2rem", margin: "28px 0 12px" }}>Past incidents</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {incidents.filter((i) => i.resolved).slice(0, 15).map((it) => <IncidentCard key={it.id} it={it} admin={admin} />)}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function IncidentCard({ it, admin }: { it: Incident; admin: boolean }) {
  return (
    <div className="card" style={{ padding: "1.1rem 1.3rem", borderLeft: `3px solid ${it.resolved ? "var(--border)" : impactColor[it.impact]}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="pill" style={{ fontSize: "0.62rem", textTransform: "uppercase", color: it.resolved ? "var(--text-faint)" : impactColor[it.impact], borderColor: "currentColor" }}>{it.resolved ? "Resolved" : it.impact}</span>
        <b>{it.title}</b>
        <span className="faint" style={{ marginLeft: "auto", fontSize: "0.78rem" }}>{new Date(it.at).toLocaleString()}</span>
      </div>
      {it.body && <p className="muted" style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>{it.body}</p>}
      {admin && (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {!it.resolved && <form action={resolveIncidentAction}><input type="hidden" name="id" value={it.id} /><button className="btn btn-ghost btn-sm" type="submit">Mark resolved</button></form>}
          <form action={deleteIncidentAction}><input type="hidden" name="id" value={it.id} /><button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button></form>
        </div>
      )}
    </div>
  );
}
