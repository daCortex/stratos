import Link from "next/link";
import { currentUser, isPlatformAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { DISCORD_URL } from "@/lib/site";

export default async function PlatformHeader() {
  const user = await currentUser();
  const admin = isPlatformAdmin(user);
  return (
    <header className="site-header">
      <div className="container-x" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/stratos-reversed.svg" alt="Stratos" style={{ height: 30, width: "auto" }} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 18, fontSize: "0.9rem" }}>
          <Link href="/explore" className="muted">Explore VAs</Link>
          <Link href="/help" className="muted">Help</Link>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="muted">Discord</a>
          {user ? (
            <>
              {admin && <Link href="/admin" className="btn btn-ghost btn-sm" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>Admin</Link>}
              <Link href="/app" className="btn btn-ghost btn-sm">Dashboard</Link>
              <form action={logoutAction}><button className="btn btn-ghost btn-sm" type="submit">Sign out</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="muted">Sign in</Link>
              <Link href="/new" className="btn btn-primary btn-sm">Create a crew center</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
