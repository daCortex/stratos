import Link from "next/link";
import PlatformHeader from "@/components/PlatformHeader";
import { signupAction } from "@/app/actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const msg = sp.error === "taken" ? "That IFC username is already registered." : sp.error === "missing" ? "Please fill in all fields." : null;
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ maxWidth: 440, paddingTop: 60, paddingBottom: 80 }}>
        <h1 style={{ fontSize: "1.8rem" }}>Create your account</h1>
        <p className="muted" style={{ marginTop: 4 }}>One account works across every VA you fly for.</p>
        {msg && <p className="pill" style={{ borderColor: "#e0556a", color: "#e0556a", marginTop: 14 }}>{msg}</p>}
        <form action={signupAction} className="card" style={{ padding: "1.4rem", marginTop: 20, display: "grid", gap: 14 }}>
          <input type="hidden" name="next" value={sp.next || "/app"} />
          <div><label className="label">IFC username</label><input name="ifc" className="input" placeholder="yourname" required /></div>
          <div><label className="label">Display name</label><input name="name" className="input" placeholder="Your name" /></div>
          <div><label className="label">Password</label><input name="password" type="password" className="input" minLength={4} required /></div>
          <button className="btn btn-primary" type="submit">Create account</button>
        </form>
        <p className="muted" style={{ marginTop: 16, fontSize: "0.9rem" }}>Already have one? <Link href="/login" style={{ color: "var(--primary)" }}>Sign in</Link></p>
      </main>
    </>
  );
}
