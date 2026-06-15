import { redirect } from "next/navigation";
import PlatformHeader from "@/components/PlatformHeader";
import AdminSidebar from "@/components/AdminSidebar";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?next=/admin");
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ marginBottom: 22 }}>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>Platform backend</span>
          <h1 style={{ fontSize: "1.9rem", margin: "4px 0 0" }}>Mission Control</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Signed in as <b style={{ color: "var(--text)" }}>{admin!.displayName}</b> · full control over every account and VA.</p>
        </div>
        <div className="studio-shell">
          <AdminSidebar />
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      </main>
    </>
  );
}
