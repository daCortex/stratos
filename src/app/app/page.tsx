import Link from "next/link";
import { redirect } from "next/navigation";
import PlatformHeader from "@/components/PlatformHeader";
import { currentUser } from "@/lib/auth";
import { listOrgsForUser, getMembership } from "@/lib/store";

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/app");
  const orgs = await listOrgsForUser(user!.id);
  const rows = await Promise.all(orgs.map(async (o) => ({ org: o, m: await getMembership(o.id, user!.id) })));

  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "2rem", margin: 0 }}>Welcome, {user!.displayName}</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>Your crew centers and pilot accounts.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/join" className="btn btn-ghost">Join a VA</Link>
            <Link href="/new" className="btn btn-primary">Create a crew center</Link>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center", marginTop: 28 }}>
            <p className="muted">You're not part of any VA yet.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
              <Link href="/new" className="btn btn-primary">Create your own</Link>
              <Link href="/join" className="btn btn-ghost">Join with a code</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginTop: 28 }}>
            {rows.map(({ org, m }) => {
              const manage = m && (m.role === "owner" || m.role === "staff");
              return (
                <div key={org.id} className="card" style={{ padding: "1.3rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 11, background: `hsl(${org.branding.hue} 65% 55%)`, display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontFamily: "var(--font-head)" }}>{org.name.slice(0, 1)}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{org.name}</div>
                      <div className="faint" style={{ fontSize: "0.8rem", textTransform: "capitalize" }}>{m?.role} · {m?.callsign}{m?.status === "pending" ? " · pending" : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                    <Link href={`/va/${org.slug}`} className="btn btn-ghost btn-sm">View site</Link>
                    <Link href={`/va/${org.slug}/pilot`} className="btn btn-ghost btn-sm">Pilot hub</Link>
                    {manage && <Link href={`/va/${org.slug}/crew`} className="btn btn-ghost btn-sm">Crew center</Link>}
                    {m?.role === "owner" && <Link href={`/va/${org.slug}/settings`} className="btn btn-primary btn-sm">Customize</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
