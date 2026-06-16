import Link from "next/link";
import type { Org } from "@/lib/types";
import { currentUser, orgRole } from "@/lib/auth";
import { orgModules } from "@/lib/theme";
import VANav from "./VANav";

export default async function VAHeader({ org }: { org: Org }) {
  const user = await currentUser();
  const { membership, canManage } = await orgRole(org, user);
  const base = `/va/${org.slug}`;
  const items = org.nav.filter((n) => n.enabled).map((n) => ({ key: n.key, label: n.label, href: n.href }));
  if (orgModules(org.settings).liveMap) items.splice(1, 0, { key: "live", label: "Live", href: "/live" });

  return (
    <header className="site-header" style={{ position: "sticky" }}>
      <div className="container-x" style={{ display: "flex", alignItems: "center", gap: 18, height: 66, position: "relative" }}>
        <Link href={base} style={{ display: "flex", alignItems: "center", gap: 11, fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
          {org.branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.branding.logoUrl} alt={org.name} style={{ height: 32, width: "auto", maxWidth: 150, objectFit: "contain" }} />
          ) : (
            <>
              <span style={{ width: 30, height: 30, borderRadius: "calc(var(--radius) - 5px)", background: "linear-gradient(135deg, var(--primary), var(--accent))" }} />
              <span style={{ letterSpacing: "-0.01em" }}>{org.name}</span>
            </>
          )}
        </Link>

        <VANav
          base={base}
          items={items}
          authed={!!user}
          isMember={!!membership}
          canManage={canManage}
          loginHref={`/login?next=${base}/pilot`}
        />
      </div>
    </header>
  );
}
