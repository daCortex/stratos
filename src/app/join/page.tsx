import PlatformHeader from "@/components/PlatformHeader";
import { joinAction } from "@/app/actions";
import { findJoinTarget } from "@/lib/store";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string }> }) {
  const sp = await searchParams;
  const code = sp.code || "";
  const target = code ? await findJoinTarget(code) : null;
  const errors: Record<string, string> = {
    invalid: "That code doesn't match any VA.",
    used: "That one-time code has already been used.",
    notyou: "That invite is reserved for a different IFC username.",
  };
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ maxWidth: 460, paddingTop: 60, paddingBottom: 80 }}>
        <h1 style={{ fontSize: "1.8rem" }}>Join a crew center</h1>
        <p className="muted" style={{ marginTop: 4 }}>Enter the join code your VA gave you, or use your invite link.</p>
        {sp.error && <p className="pill" style={{ borderColor: "#e0556a", color: "#e0556a", marginTop: 14 }}>{errors[sp.error] || "Something went wrong."}</p>}
        {target && (
          <div className="card" style={{ padding: "1rem 1.2rem", marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: `hsl(${target.org.branding.hue} 65% 55%)`, display: "grid", placeItems: "center", color: "white", fontWeight: 700 }}>{target.org.name.slice(0, 1)}</span>
            <div><div style={{ fontWeight: 600 }}>{target.org.name}</div><div className="faint" style={{ fontSize: "0.8rem" }}>You're about to join this airline</div></div>
          </div>
        )}
        <form action={joinAction} className="card" style={{ padding: "1.4rem", marginTop: 16, display: "grid", gap: 14 }}>
          <div><label className="label">Join code</label><input name="code" className="input" defaultValue={code} placeholder="SKYLINE" style={{ textTransform: "uppercase" }} required /></div>
          <div><label className="label">Preferred callsign <span className="faint">(optional)</span></label><input name="callsign" className="input" placeholder="auto-assigned if blank" /></div>
          <button className="btn btn-primary" type="submit">Join</button>
        </form>
      </main>
    </>
  );
}
