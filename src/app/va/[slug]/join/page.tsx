import Link from "next/link";
import { getOrgBySlug, getMembership } from "@/lib/store";
import { currentUser } from "@/lib/auth";
import { joinAction } from "@/app/actions";

export default async function VAJoin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const base = `/va/${org.slug}`;
  const user = await currentUser();
  const member = user ? await getMembership(org.id, user.id) : null;

  return (
    <main className="container-x" style={{ maxWidth: 480, paddingTop: 56, paddingBottom: 80 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Join {org.name}</span>
      <h1 style={{ fontSize: "1.9rem", margin: "6px 0 6px" }}>Fly with us</h1>
      <p className="muted">{org.settings.about}</p>

      {member ? (
        <div className="card" style={{ padding: "1.6rem", marginTop: 18, textAlign: "center" }}>
          <p className="muted">You're already on the roster as <b style={{ color: "var(--text)" }}>{member.callsign}</b>.</p>
          <Link href={`${base}/pilot`} className="btn btn-primary" style={{ marginTop: 10 }}>Go to your flight deck</Link>
        </div>
      ) : !user ? (
        <div className="card" style={{ padding: "1.6rem", marginTop: 18 }}>
          <p className="muted" style={{ marginTop: 0 }}>Sign in (or create a free account) to join. Your Infinite Flight Community username is your identity across every VA.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href={`/login?next=${base}/join`} className="btn btn-ghost">Sign in</Link>
            <Link href={`/signup?next=${base}/join`} className="btn btn-primary">Create account</Link>
          </div>
        </div>
      ) : (
        <form action={joinAction} className="card" style={{ padding: "1.5rem", marginTop: 18, display: "grid", gap: 14 }}>
          <div><label className="label">Join code</label><input name="code" className="input" placeholder={org.joinCode} style={{ textTransform: "uppercase" }} required /><p className="faint" style={{ fontSize: "0.78rem", marginTop: 6 }}>Ask your staff for the code, or use the one-time invite link they sent you.</p></div>
          <div><label className="label">Preferred callsign <span className="faint">(optional)</span></label><input name="callsign" className="input" placeholder={`${org.callsignPrefix}123`} /></div>
          <button className="btn btn-primary" type="submit">Request to join</button>
          {org.settings.requireApproval && <p className="faint" style={{ fontSize: "0.78rem", margin: 0 }}>New pilots are reviewed by staff before activation.</p>}
        </form>
      )}
    </main>
  );
}
