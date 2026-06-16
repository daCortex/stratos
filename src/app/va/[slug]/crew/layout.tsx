import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgBySlug } from "@/lib/store";
import { currentUser, orgRole } from "@/lib/auth";
import { orgModules } from "@/lib/theme";
import { DISCORD_URL } from "@/lib/site";

export default async function CrewLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  if (!user) redirect(`/login?next=/va/${slug}/crew`);
  const { canManage, isOwner } = await orgRole(org!, user!);
  if (!canManage) redirect(`/va/${slug}`);

  const base = `/va/${slug}/crew`;
  const tabs = [
    ["Dashboard", base],
    ["Roster", `${base}/pilots`],
    ["PIREPs", `${base}/pireps`],
    ...(orgModules(org!.settings).analytics ? [["Analytics", `${base}/analytics`]] : []),
    ["Routes", `${base}/routes`],
    ["Events", `${base}/events`],
    ["Awards", `${base}/awards`],
    ["Shop", `${base}/shop`],
    ["Challenges", `${base}/challenges`],
    ["NOTAMs", `${base}/notams`],
    ["Applications", `${base}/applications`],
    ["News", `${base}/news`],
    ["Invites", `${base}/invites`],
    ["Leave", `${base}/loa`],
    ["Reports", `${base}/reports`],
  ];

  return (
    <main className="container-x" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div><span className="eyebrow" style={{ color: "var(--primary)" }}>Crew Center</span><h1 style={{ fontSize: "1.7rem", margin: "2px 0 0" }}>{org!.name}</h1></div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">💬 Support</a>
          {isOwner && <Link href={`/va/${slug}/settings`} className="btn btn-primary btn-sm">Customize site →</Link>}
        </div>
      </div>
      <nav style={{ display: "flex", gap: 6, marginTop: 18, marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {tabs.map(([label, href]) => (
          <Link key={href} href={href} className="btn btn-ghost btn-sm">{label}</Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
