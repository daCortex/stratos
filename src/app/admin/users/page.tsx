import { listAllUsers, listOrgsForUser } from "@/lib/store";
import { isPlatformAdmin, currentUser } from "@/lib/auth";
import { setPasswordAction, renameUserAction, toggleAdminAction, deleteUserAction } from "../actions";

export default async function AdminUsers() {
  const me = await currentUser();
  const users = await listAllUsers();
  const rows = await Promise.all(users.map(async (u) => ({ u, vas: (await listOrgsForUser(u.id)).length, admin: isPlatformAdmin(u) })));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p className="muted" style={{ margin: 0 }}>{users.length} registered account{users.length === 1 ? "" : "s"}. Reset passwords, grant admin, or remove anyone.</p>
      {rows.map(({ u, vas, admin }) => (
        <div key={u.id} className="card" style={{ padding: "1.2rem 1.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-2)", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-head)" }}>{u.displayName.slice(0, 1).toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700 }}>{u.displayName} {admin && <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", fontSize: "0.62rem" }}>ADMIN</span>}{u.id === me?.id && <span className="faint" style={{ fontSize: "0.75rem" }}> · you</span>}</div>
              <div className="faint" style={{ fontSize: "0.82rem" }}>IFC @{u.ifcUsername} · {vas} VA{vas === 1 ? "" : "s"} · joined {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <form action={renameUserAction} style={{ display: "flex", gap: 6 }}>
              <input type="hidden" name="id" value={u.id} />
              <input name="name" defaultValue={u.displayName} className="input" style={{ width: 160, padding: "0.35rem 0.6rem" }} />
              <button className="btn btn-ghost btn-sm" type="submit">Rename</button>
            </form>
            <form action={setPasswordAction} style={{ display: "flex", gap: 6 }}>
              <input type="hidden" name="id" value={u.id} />
              <input name="password" type="text" placeholder="set new password" className="input" style={{ width: 170, padding: "0.35rem 0.6rem" }} />
              <button className="btn btn-ghost btn-sm" type="submit">Reset</button>
            </form>
            <form action={toggleAdminAction}>
              <input type="hidden" name="id" value={u.id} />
              <input type="hidden" name="make" value={admin ? "0" : "1"} />
              <button className="btn btn-ghost btn-sm" type="submit">{admin ? "Revoke admin" : "Make admin"}</button>
            </form>
            {u.id !== me?.id && (
              <form action={deleteUserAction} style={{ marginLeft: "auto" }}>
                <input type="hidden" name="id" value={u.id} />
                <button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a", borderColor: "color-mix(in srgb, #e0556a 40%, var(--border))" }}>Delete</button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
