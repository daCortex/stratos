"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const p = usePathname();
  const items: [string, string][] = [["Overview", "/admin"], ["Airlines", "/admin/vas"], ["Accounts", "/admin/users"]];
  return (
    <aside className="studio-sidebar">
      <div className="eyebrow" style={{ padding: "0 0.5rem 0.5rem", color: "var(--text-faint)" }}>Backend</div>
      {items.map(([label, href]) => (
        <Link key={href} href={href} className="studio-tab" data-active={p === href}>{label}</Link>
      ))}
    </aside>
  );
}
