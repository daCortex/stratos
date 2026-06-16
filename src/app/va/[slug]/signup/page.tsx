import Link from "next/link";
import { getOrgBySlug } from "@/lib/store";
import { signupAction } from "@/app/actions";
import DiscordButton from "@/components/DiscordButton";

export default async function VASignup({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; next?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const org = (await getOrgBySlug(slug))!;
  const base = `/va/${org.slug}`;
  const next = sp.next || `${base}/join`;
  const msg = sp.error === "taken" ? "That IFC username is already registered." : sp.error === "missing" ? "Please fill in all fields." : null;

  return (
    <main className="container-x" style={{ maxWidth: 440, paddingTop: 56, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>{org.name}</span>
      <h1 style={{ fontSize: "1.8rem", margin: "6px 0 4px" }}>Create your account</h1>
      <p className="muted" style={{ marginTop: 0 }}>Your Infinite Flight Community username is your identity.</p>
      {msg && <p className="pill" style={{ borderColor: "#e0556a", color: "#e0556a", marginTop: 10 }}>{msg}</p>}

      <DiscordButton next={next} label="Continue with Discord" />

      <form action={signupAction} className="card" style={{ padding: "1.4rem", marginTop: 14, display: "grid", gap: 14 }}>
        <input type="hidden" name="next" value={next} />
        <div><label className="label">IFC username</label><input name="ifc" className="input" placeholder="yourname" required /></div>
        <div><label className="label">Display name</label><input name="name" className="input" placeholder="Your name" /></div>
        <div><label className="label">Password</label><input name="password" type="password" className="input" minLength={4} required /></div>
        <button className="btn btn-primary" type="submit">Create account</button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: "0.9rem" }}>Already have one? <Link href={`${base}/login?next=${encodeURIComponent(next)}`} style={{ color: "var(--primary)" }}>Sign in</Link></p>
    </main>
  );
}
