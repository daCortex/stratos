import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgBySlug } from "@/lib/store";
import { currentUser, orgRole } from "@/lib/auth";
import SettingsStudio from "@/components/SettingsStudio";

export default async function SettingsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; welcome?: string; domain?: string }> }) {
  const { slug } = await params;
  const { saved, welcome, domain } = await searchParams;
  const domainMsg: Record<string, { c: string; t: string }> = {
    verified: { c: "var(--primary)", t: "✓ Domain verified — your crew center is now served on your own domain." },
    dnsfail: { c: "#e0556a", t: "Couldn't find the TXT verification record yet. DNS can take a few minutes — add it and try again." },
    notoken: { c: "#e0556a", t: "Save your domain first to generate the verification record." },
  };
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  if (!user) redirect(`/login?next=/va/${slug}/settings`);
  const { isOwner } = await orgRole(org!, user!);
  if (!isOwner) redirect(`/va/${slug}`);

  return (
    <main className="container-x" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>Customize</span>
          <h1 style={{ fontSize: "1.7rem", margin: "2px 0 0" }}>Make it yours</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/va/${slug}`} className="btn btn-ghost btn-sm">View site ↗</Link>
          <Link href={`/va/${slug}/crew`} className="btn btn-ghost btn-sm">Crew center</Link>
        </div>
      </div>

      {domain && domainMsg[domain] && (
        <p className="pill" style={{ color: domainMsg[domain].c, borderColor: domainMsg[domain].c, marginTop: 16 }}>{domainMsg[domain].t}</p>
      )}

      {welcome && (
        <div className="card" style={{ padding: "1.2rem 1.4rem", marginTop: 16, borderColor: "var(--primary)" }}>
          <b>Welcome aboard 🎉</b>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>This is your studio. Pick your colours, fonts and background, shape the menu, add hubs and aircraft — then hit Save and your site is live. Your permanent join code is in Crew Center → Invites.</p>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <SettingsStudio org={org!} saved={!!saved} />
      </div>
    </main>
  );
}
