import Link from "next/link";
import { getOrgBySlug, getAppForm, getMembership } from "@/lib/store";
import { currentUser } from "@/lib/auth";
import { submitApplicationAction } from "./actions";

export default async function ApplyPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ submitted?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const org = (await getOrgBySlug(slug))!;
  const base = `/va/${org.slug}`;
  const form = await getAppForm(org.id);
  const user = await currentUser();
  const member = user ? await getMembership(org.id, user.id) : null;

  return (
    <main className="container-x" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 640 }}>
      <span className="eyebrow" style={{ color: "var(--primary)" }}>Recruitment</span>
      <h1 style={{ fontSize: "2.2rem", margin: "6px 0 10px" }}>Fly for {org.name}</h1>
      <p className="muted" style={{ fontSize: "1.02rem" }}>{form.intro || org.settings.about}</p>

      {sp.submitted ? (
        <div className="card" style={{ padding: "1.6rem", marginTop: 20, textAlign: "center", borderColor: "var(--primary)" }}>
          <b>Application submitted ✓</b>
          <p className="muted" style={{ margin: "6px 0 0" }}>Our staff will review it shortly. You'll get a notification when there's a decision.</p>
        </div>
      ) : member ? (
        <div className="card" style={{ padding: "1.6rem", marginTop: 20, textAlign: "center" }}>
          <p className="muted">You're already on the roster as <b style={{ color: "var(--text)" }}>{member.callsign}</b>.</p>
          <Link href={`${base}/pilot`} className="btn btn-primary">Go to your flight deck</Link>
        </div>
      ) : !form.enabled ? (
        <div className="card" style={{ padding: "1.6rem", marginTop: 20 }}>
          <p className="muted" style={{ margin: 0 }}>Applications are currently closed. {org.settings.applyUrl && <a href={org.settings.applyUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>External form ↗</a>}</p>
        </div>
      ) : !user ? (
        <div className="card" style={{ padding: "1.6rem", marginTop: 20 }}>
          <p className="muted" style={{ marginTop: 0 }}>Sign in with your IFC username to apply.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href={`/login?next=${base}/apply`} className="btn btn-ghost">Sign in</Link>
            <Link href={`/signup?next=${base}/apply`} className="btn btn-primary">Create account</Link>
          </div>
        </div>
      ) : (
        <form action={submitApplicationAction.bind(null, slug)} className="card" style={{ padding: "1.6rem", marginTop: 20, display: "grid", gap: 16 }}>
          {form.questions.length === 0 && <p className="muted">This airline hasn't added any questions. Just submit to register your interest.</p>}
          {form.questions.map((q) => (
            <div key={q.id}>
              <label className="label">{q.label}{q.required && <span style={{ color: "var(--primary)" }}> *</span>}</label>
              {q.type === "long" ? (
                <textarea name={q.id} className="input" rows={3} required={q.required} />
              ) : q.type === "choice" || q.type === "quiz" ? (
                <select name={q.id} className="input" required={q.required} defaultValue="">
                  <option value="" disabled>Select…</option>
                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input name={q.id} className="input" required={q.required} />
              )}
            </div>
          ))}
          <button className="btn btn-primary" type="submit">Submit application</button>
          {form.questions.some((q) => q.type === "quiz") && <p className="faint" style={{ fontSize: "0.78rem", margin: 0 }}>Some questions are graded automatically.</p>}
        </form>
      )}
    </main>
  );
}
