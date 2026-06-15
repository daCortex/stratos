import Link from "next/link";
import { getOrgBySlug, listMembers, listPireps, listNews, memberStats } from "@/lib/store";

export default async function VAHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const members = await listMembers(org.id);
  const pireps = await listPireps(org.id, { status: "approved" });
  const news = (await listNews(org.id)).slice(0, 3);
  const base = `/va/${org.slug}`;

  let totalMin = 0;
  for (const m of members) totalMin += (await memberStats(m)).minutes;
  const stats = [
    [members.filter((m) => m.status === "active").length, "Active pilots"],
    [Math.round(totalMin / 60).toLocaleString(), "Hours flown"],
    [pireps.length, "Flights logged"],
    [org.hubs.length, "Hubs"],
  ] as const;

  return (
    <main>
      <section style={{ position: "relative", overflow: "hidden" }}>
        {org.settings.bannerUrl && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            {org.settings.bannerVideo ? (
              <video src={org.settings.bannerUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.settings.bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, var(--page-bg) 30%, transparent), linear-gradient(to top, var(--page-bg), transparent 60%)" }} />
          </div>
        )}
        <div className="container-x" style={{ paddingTop: 80, paddingBottom: 64, position: "relative", zIndex: 1 }}>
          <div className="reveal" style={{ maxWidth: 760 }}>
            <span className="eyebrow" style={{ color: "var(--primary)" }}>{org.callsignPrefix} · Virtual Airline</span>
            <h1 style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)", lineHeight: 1.06, margin: "0.8rem 0 0" }}>{org.name}</h1>
            <p className="muted" style={{ fontSize: "1.2rem", marginTop: "1.1rem", maxWidth: 560 }}>{org.settings.tagline}</p>
            <div style={{ display: "flex", gap: 12, marginTop: "1.8rem", flexWrap: "wrap" }}>
              <Link href={`${base}/join`} className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Join the crew</Link>
              <Link href={`${base}/fleet`} className="btn btn-ghost" style={{ padding: "0.75rem 1.5rem" }}>Explore the fleet</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x" style={{ paddingBottom: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          {stats.map(([v, l], i) => (
            <div key={i} className="card" style={{ padding: "1.3rem 1.4rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-head)" }} className="gradient-text">{v}</div>
              <div className="faint" style={{ fontSize: "0.82rem", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {news.length > 0 && (
        <section className="container-x" style={{ paddingBottom: 56 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.4rem", margin: 0 }}>Latest from the flight deck</h2>
            <Link href={`${base}/news`} className="muted" style={{ fontSize: "0.9rem" }}>All news →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {news.map((n) => (
              <div key={n.id} className="card" style={{ padding: "1.2rem" }}>
                <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>{n.category}</span>
                <h3 style={{ fontSize: "1.05rem", margin: "0.7rem 0 0.3rem" }}>{n.title}</h3>
                <p className="muted" style={{ fontSize: "0.88rem", margin: 0 }}>{n.body.slice(0, 120)}{n.body.length > 120 ? "…" : ""}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-x" style={{ paddingBottom: 64 }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 16 }}>The fleet</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {org.fleet.map((a) => (
            <div key={a.id} className="card" style={{ padding: "1.3rem" }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "1.2rem" }}>{a.type}</div>
              <div className="faint" style={{ fontSize: "0.8rem" }}>{a.registration}</div>
              <p className="muted" style={{ fontSize: "0.88rem", margin: "0.8rem 0 0" }}>{a.tagline}</p>
              <div className="faint" style={{ fontSize: "0.78rem", marginTop: 10 }}>{a.seats} seats · {a.rangeNm.toLocaleString()} nm</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
