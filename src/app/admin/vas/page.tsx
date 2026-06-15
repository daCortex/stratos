import Link from "next/link";
import { listAllOrgs, listAllUsers, orgCounts } from "@/lib/store";
import { deleteVaAction, transferVaAction, renameVaAction } from "../actions";

export default async function AdminVas() {
  const orgs = await listAllOrgs();
  const users = await listAllUsers();
  const userById = new Map(users.map((u) => [u.id, u]));
  const rows = await Promise.all(orgs.map(async (o) => ({ o, c: await orgCounts(o.id) })));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p className="muted" style={{ margin: 0 }}>{orgs.length} airline{orgs.length === 1 ? "" : "s"} on the platform. You have owner control of every one.</p>
      {rows.map(({ o, c }) => (
        <div key={o.id} className="card" style={{ padding: "1.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: `hsl(${o.branding.hue} 60% 52%)`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontFamily: "var(--font-head)" }}>{o.name.slice(0, 1)}</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{o.name}</div>
              <div className="faint" style={{ fontSize: "0.82rem" }}>/va/{o.slug} · {o.callsignPrefix} · code <b style={{ color: "var(--text-dim)" }}>{o.joinCode}</b> · owner {userById.get(o.ownerUserId)?.ifcUsername ?? "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 18, marginRight: 8 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontWeight: 700 }}>{c.members}</div><div className="faint" style={{ fontSize: "0.7rem" }}>members</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontWeight: 700 }}>{c.pireps}</div><div className="faint" style={{ fontSize: "0.7rem" }}>pireps</div></div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/va/${o.slug}`} className="btn btn-ghost btn-sm">Site ↗</Link>
              <Link href={`/va/${o.slug}/crew`} className="btn btn-ghost btn-sm">Crew center</Link>
              <Link href={`/va/${o.slug}/settings`} className="btn btn-primary btn-sm">Customize</Link>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <form action={renameVaAction} style={{ display: "flex", gap: 6 }}>
              <input type="hidden" name="id" value={o.id} />
              <input name="name" defaultValue={o.name} className="input" style={{ width: 180, padding: "0.35rem 0.6rem" }} />
              <button className="btn btn-ghost btn-sm" type="submit">Rename</button>
            </form>
            <form action={transferVaAction} style={{ display: "flex", gap: 6 }}>
              <input type="hidden" name="id" value={o.id} />
              <input name="ifc" placeholder="transfer to IFC user" className="input" style={{ width: 190, padding: "0.35rem 0.6rem" }} />
              <button className="btn btn-ghost btn-sm" type="submit">Transfer</button>
            </form>
            <form action={deleteVaAction} style={{ marginLeft: "auto" }}>
              <input type="hidden" name="id" value={o.id} />
              <button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a", borderColor: "color-mix(in srgb, #e0556a 40%, var(--border))" }}>Delete VA</button>
            </form>
          </div>
        </div>
      ))}
      {orgs.length === 0 && <p className="muted">No airlines registered yet.</p>}
    </div>
  );
}
