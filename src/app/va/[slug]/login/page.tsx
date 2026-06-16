import Link from "next/link";
import { getOrgBySlug } from "@/lib/store";
import { loginAction } from "@/app/actions";
import DiscordButton from "@/components/DiscordButton";

export default async function VALogin({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; next?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const org = (await getOrgBySlug(slug))!;
  const base = `/va/${org.slug}`;
  const next = sp.next || `${base}/pilot`;

  return (
    <main className="container-x" style={{ maxWidth: 440, paddingTop: 56, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>{org.name}</span>
      <h1 style={{ fontSize: "1.8rem", margin: "6px 0 4px" }}>Sign in</h1>
      <p className="muted" style={{ marginTop: 0 }}>Use your Infinite Flight Community username.</p>
      {sp.error && <p className="pill" style={{ borderColor: "#e0556a", color: "#e0556a", marginTop: 10 }}>Incorrect username or password.</p>}

      <DiscordButton next={next} label="Continue with Discord" />

      <form action={loginAction} className="card" style={{ padding: "1.4rem", marginTop: 14, display: "grid", gap: 14 }}>
        <input type="hidden" name="next" value={next} />
        <div><label className="label">IFC username</label><input name="ifc" className="input" placeholder="yourname" autoComplete="username" required /></div>
        <div><label className="label">Password</label><input name="password" type="password" className="input" autoComplete="current-password" required /></div>
        <button className="btn btn-primary" type="submit">Sign in</button>
      </form>
      <p className="muted" style={{ marginTop: 16, fontSize: "0.9rem" }}>New here? <Link href={`${base}/signup?next=${encodeURIComponent(next)}`} style={{ color: "var(--primary)" }}>Create an account</Link></p>
    </main>
  );
}
