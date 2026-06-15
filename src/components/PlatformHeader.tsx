import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export default async function PlatformHeader() {
  const user = await currentUser();
  return (
    <header style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 70%, transparent)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 }}>
      <div className="container-x" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/stratos-reversed.svg" alt="Stratos" style={{ height: 30, width: "auto" }} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 18, fontSize: "0.9rem" }}>
          <Link href="/explore" className="muted">Explore VAs</Link>
          <Link href="/join" className="muted">Join a VA</Link>
          {user ? (
            <>
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
