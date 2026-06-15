"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

type Item = { key: string; label: string; href: string };
const MAX_INLINE = 7;

export default function VANav({
  base, items, authed, isMember, canManage, loginHref,
}: {
  base: string; items: Item[]; authed: boolean; isMember: boolean; canManage: boolean; loginHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => {
    const full = `${base}${href}`;
    return href === "" ? pathname === base : pathname === full || pathname.startsWith(full + "/");
  };

  const inline = items.slice(0, MAX_INLINE);
  const overflow = items.slice(MAX_INLINE);

  const authButtons = (
    <>
      {authed ? (
        <>
          {isMember ? <Link href={`${base}/pilot`} className="btn btn-ghost btn-sm">Flight deck</Link> : <Link href={`${base}/join`} className="btn btn-ghost btn-sm">Join</Link>}
          {canManage && <Link href={`${base}/crew`} className="btn btn-primary btn-sm">Crew center</Link>}
          <form action={logoutAction}><button className="btn btn-ghost btn-sm" type="submit">Sign out</button></form>
        </>
      ) : (
        <>
          <Link href={loginHref} className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href={`${base}/join`} className="btn btn-primary btn-sm">Join</Link>
        </>
      )}
    </>
  );

  return (
    <>
      {/* desktop nav */}
      <nav className="desktop-only" style={{ gap: 20, alignItems: "center", flex: 1, marginLeft: 8 }}>
        {inline.map((n) => (
          <Link key={n.key} href={`${base}${n.href}`} className={`nav-link${isActive(n.href) ? " active" : ""}`}>{n.label}</Link>
        ))}
        {overflow.length > 0 && (
          <div style={{ position: "relative" }} onMouseLeave={() => setMore(false)}>
            <button className="nav-link" onClick={() => setMore((o) => !o)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 4 }}>
              More <span style={{ fontSize: "0.65rem" }}>▾</span>
            </button>
            {more && (
              <div className="mobile-panel" style={{ position: "absolute", top: "calc(100% + 10px)", left: 0, minWidth: 170, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: 6, display: "flex", flexDirection: "column", zIndex: 60 }}>
                {overflow.map((n) => (
                  <Link key={n.key} href={`${base}${n.href}`} onClick={() => setMore(false)} className="muted" style={{ padding: "0.5rem 0.7rem", borderRadius: "calc(var(--radius) - 6px)", fontSize: "0.88rem" }}>{n.label}</Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="desktop-only" style={{ gap: 10, alignItems: "center", flexShrink: 0 }}>{authButtons}</div>

      {/* mobile toggle */}
      <div className="mobile-only" style={{ marginLeft: "auto" }}>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="btn btn-ghost btn-sm" style={{ padding: "0.45rem 0.6rem" }}>
          <span style={{ display: "grid", gap: 4 }}>
            <span style={{ width: 18, height: 2, background: "currentColor", borderRadius: 2, transition: "transform .2s", transform: open ? "translateY(6px) rotate(45deg)" : "none" }} />
            <span style={{ width: 18, height: 2, background: "currentColor", borderRadius: 2, opacity: open ? 0 : 1, transition: "opacity .2s" }} />
            <span style={{ width: 18, height: 2, background: "currentColor", borderRadius: 2, transition: "transform .2s", transform: open ? "translateY(-6px) rotate(-45deg)" : "none" }} />
          </span>
        </button>
      </div>

      {open && (
        <div className="mobile-only mobile-panel" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow)", flexDirection: "column", padding: "0.75rem 1.4rem 1.1rem", zIndex: 60 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((n) => (
              <Link key={n.key} href={`${base}${n.href}`} onClick={() => setOpen(false)} className={`nav-link${isActive(n.href) ? " active" : ""}`} style={{ padding: "0.7rem 0", borderBottom: "1px solid var(--border)", fontSize: "1rem" }}>{n.label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }} onClick={() => setOpen(false)}>{authButtons}</div>
        </div>
      )}
    </>
  );
}
