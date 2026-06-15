import Link from "next/link";
import PlatformHeader from "@/components/PlatformHeader";
import { loginAction } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ maxWidth: 440, paddingTop: 60, paddingBottom: 80 }}>
        <h1 style={{ fontSize: "1.8rem" }}>Sign in</h1>
        <p className="muted" style={{ marginTop: 4 }}>Use your Infinite Flight Community username.</p>
        {sp.error && <p className="pill" style={{ borderColor: "#e0556a", color: "#e0556a", marginTop: 14 }}>Incorrect username or password.</p>}
        <form action={loginAction} className="card" style={{ padding: "1.4rem", marginTop: 20, display: "grid", gap: 14 }}>
          <input type="hidden" name="next" value={sp.next || "/app"} />
          <div><label className="label">IFC username</label><input name="ifc" className="input" placeholder="yourname" autoComplete="username" required /></div>
          <div><label className="label">Password</label><input name="password" type="password" className="input" autoComplete="current-password" required /></div>
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
        <p className="muted" style={{ marginTop: 16, fontSize: "0.9rem" }}>No account? <Link href="/signup" style={{ color: "var(--primary)" }}>Create one</Link></p>
      </main>
    </>
  );
}
