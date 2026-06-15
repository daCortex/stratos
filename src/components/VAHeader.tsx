import Link from "next/link";
import type { Org } from "@/lib/types";
import { currentUser, orgRole } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export default async function VAHeader({ org }: { org: Org }) {
  const user = await currentUser();
  const { membership, canManage } = await orgRole(org, user);
  const base = `/va/${org.slug}`;
  const nav = org.nav.filter((n) => n.enabled);

  return (
    <header style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--surface) 80%, transparent)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 40 }}>
      <div className="container-x" style={{ display: "flex", alignItems: "center", gap: 20, height: 66 }}>
        <Link href={base} style={{ display: "flex", alignItems: "center", gap: 11, fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
          {org.branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.branding.logoUrl} alt={org.name} style={{ height: 32, width: "auto", maxWidth: 140, objectFit: "contain" }} />
          ) : (
            <>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, var(--primary), var(--accent))" }} />
              {org.name}
            </>
          )}
        </Link>

        <nav style={{ display: "flex", gap: 16, fontSize: "0.88rem", flex: 1, overflow: "auto" }} className="va-nav">
          {nav.map((n) => (
            <Link key={n.key} href={`${base}${n.href}`} className="muted" style={{ whiteSpace: "nowrap" }}>{n.label}</Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              {membership ? <Link href={`${base}/pilot`} className="btn btn-ghost btn-sm">Pilot hub</Link> : <Link href={`${base}/join`} className="btn btn-ghost btn-sm">Join</Link>}
              {canManage && <Link href={`${base}/crew`} className="btn btn-primary btn-sm">Crew center</Link>}
              <form action={logoutAction}><button className="btn btn-ghost btn-sm" type="submit">Sign out</button></form>
            </>
          ) : (
            <>
              <Link href={`/login?next=${base}/pilot`} className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href={`${base}/join`} className="btn btn-primary btn-sm">Join</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
