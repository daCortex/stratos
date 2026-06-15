import { notFound } from "next/navigation";
import { getOrgBySlug } from "@/lib/store";
import { brandingToCss, googleFontHref } from "@/lib/theme";
import VAHeader from "@/components/VAHeader";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  return { title: org ? `${org.name} — Crew Center` : "Crew Center", description: org?.settings.tagline };
}

export default async function VALayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const vars = brandingToCss(org!.branding);
  const fontHref = googleFontHref([org!.branding.font, org!.branding.headingFont]);

  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <div style={{ ...(vars as React.CSSProperties), background: "var(--page-bg)", color: "var(--text)", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
        <VAHeader org={org!} />
        {children}
        <footer className="hairline" style={{ marginTop: 40 }}>
          <div className="container-x faint" style={{ padding: "2rem 1.25rem", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>© {org!.name}</span>
            <span style={{ opacity: 0.7 }}>Powered quietly by Stratos</span>
          </div>
        </footer>
      </div>
    </>
  );
}
