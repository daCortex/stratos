import { getOrgBySlug, listInvites } from "@/lib/store";
import { createInviteAction, regenerateJoinCodeAction } from "../actions";

export default async function CrewInvites({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const invites = await listInvites(org.id);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: "1.4rem" }}>
        <h3 style={{ marginTop: 0 }}>Permanent join code</h3>
        <p className="faint" style={{ fontSize: "0.85rem", marginTop: 0 }}>Anyone with this code can request to join {org.name}. Share it freely, or regenerate it to lock out old codes.</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{ fontSize: "1.6rem", fontFamily: "var(--font-head)", letterSpacing: "0.1em", background: "var(--surface-2)", padding: "0.5rem 1rem", borderRadius: "var(--radius)" }}>{org.joinCode}</code>
          <form action={regenerateJoinCodeAction.bind(null, slug)}><button className="btn btn-ghost btn-sm" type="submit">Regenerate</button></form>
        </div>
        <p className="faint" style={{ fontSize: "0.8rem", marginTop: 10 }}>Direct link: <code>/join?code={org.joinCode}</code></p>
      </div>

      <div className="card" style={{ padding: "1.4rem" }}>
        <h3 style={{ marginTop: 0 }}>One-time &amp; targeted invites</h3>
        <p className="faint" style={{ fontSize: "0.85rem", marginTop: 0 }}>Generate a single-use code, or lock an invite to one IFC username so only they can redeem it.</p>
        <form action={createInviteAction.bind(null, slug)} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label className="label">Type</label><select name="kind" className="input" style={{ width: 150 }}><option value="single">One-time</option><option value="multi">Reusable</option></select></div>
          <div><label className="label">Lock to IFC user (optional)</label><input name="ifc" className="input" placeholder="username" style={{ width: 200 }} /></div>
          <button className="btn btn-primary btn-sm" type="submit">Generate invite</button>
        </form>

        {invites.length > 0 && (
          <table className="data" style={{ marginTop: 16 }}>
            <thead><tr><th>Code</th><th>Type</th><th>Locked to</th><th>Status</th></tr></thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id}>
                  <td><code style={{ fontWeight: 600 }}>{i.code}</code></td>
                  <td className="muted">{i.kind === "single" ? "One-time" : "Reusable"}</td>
                  <td className="muted">{i.ifcUsername || "anyone"}</td>
                  <td><span className="pill" style={{ fontSize: "0.66rem", color: i.usedByUserId ? "var(--text-faint)" : "var(--primary)", borderColor: "currentColor" }}>{i.usedByUserId ? "used" : "active"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
