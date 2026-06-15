import { getOrgBySlug, listMembers, memberStats } from "@/lib/store";
import { rankForHours } from "@/lib/ranks";
import { addMemberAction, updateMemberAction, removeMemberAction, importRosterAction } from "../actions";

export default async function CrewPilots({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ imported?: string }> }) {
  const { slug } = await params;
  const { imported } = await searchParams;
  const org = (await getOrgBySlug(slug))!;
  const members = await listMembers(org.id);
  const rows = await Promise.all(members.map(async (m) => ({ m, ...(await memberStats(m)) })));

  return (
    <>
      {imported && <p className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", marginBottom: 14 }}>✓ Roster imported.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 22 }}>
        <form action={addMemberAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Add a pilot</h3>
          <p className="faint" style={{ fontSize: "0.8rem", margin: 0 }}>Invite by IFC username — they're added to the roster instantly.</p>
          <input name="ifc" className="input" placeholder="IFC username" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input name="callsign" className="input" placeholder="Callsign (auto)" />
            <input name="hours" className="input" type="number" step="0.1" placeholder="Carry-over hrs" />
          </div>
          <button className="btn btn-primary btn-sm" type="submit">Add to roster</button>
        </form>

        <form action={importRosterAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Import from another crew center</h3>
          <p className="faint" style={{ fontSize: "0.8rem", margin: 0 }}>Paste CSV with columns like <code>callsign, ifc, hours, pireps, rank</code>. Headers are matched flexibly.</p>
          <textarea name="csv" className="input" rows={4} placeholder={"callsign,ifc,hours,pireps\nSKY200,janedoe,412.5,33"} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" type="submit">Import roster</button>
            <a href={`/va/${slug}/crew/export?type=roster`} className="btn btn-ghost btn-sm">Export CSV ↓</a>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: "0.4rem 0.6rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 100px 110px 60px 110px auto", gap: 8, padding: "0.6rem 0.4rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-faint)", fontWeight: 600 }}>
          <span>Callsign</span><span>IFC user</span><span>Role</span><span>Rank</span><span>Hrs</span><span>Status</span><span></span>
        </div>
        {rows.map(({ m, minutes }) => (
          <div key={m.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 100px 110px 60px 110px auto", gap: 8, alignItems: "center", padding: "0.4rem", borderTop: "1px solid var(--border)" }}>
            <form action={updateMemberAction.bind(null, slug)} id={`m${m.id}`} style={{ display: "contents" }}>
              <input type="hidden" name="id" value={m.id} />
              <input name="callsign" defaultValue={m.callsign} className="input" style={{ padding: "0.3rem 0.45rem" }} />
              <span className="muted" style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis" }}>{m.ifUsername}</span>
              <select name="role" defaultValue={m.role} className="input" style={{ padding: "0.3rem 0.4rem" }}>
                <option value="pilot">pilot</option><option value="staff">staff</option><option value="owner">owner</option>
              </select>
              <span className="muted" style={{ fontSize: "0.84rem" }}>{m.rankLabel || rankForHours(org.ranks, minutes / 60).label}</span>
              <span style={{ fontSize: "0.85rem" }}>{Math.floor(minutes / 60)}h</span>
              <select name="status" defaultValue={m.status} className="input" style={{ padding: "0.3rem 0.4rem" }}>
                <option value="active">active</option><option value="pending">pending</option><option value="suspended">suspended</option>
              </select>
            </form>
            <div style={{ display: "flex", gap: 4 }}>
              <button form={`m${m.id}`} className="btn btn-ghost btn-sm" type="submit">Save</button>
              <form action={removeMemberAction.bind(null, slug)}>
                <input type="hidden" name="id" value={m.id} />
                <button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>✕</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
