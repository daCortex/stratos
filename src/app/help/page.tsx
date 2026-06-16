import PlatformHeader from "@/components/PlatformHeader";
import HelpCenter from "@/components/HelpCenter";

export const metadata = { title: "Stratos — Help & guides" };

export default function HelpPage() {
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ paddingTop: 36, paddingBottom: 80 }}>
        <div style={{ marginBottom: 22 }}>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>Documentation</span>
          <h1 style={{ fontSize: "1.9rem", margin: "4px 0 0" }}>Help &amp; guides</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Everything you need to run a crew center on Stratos — plus troubleshooting and FAQ.</p>
        </div>
        <HelpCenter />
      </main>
    </>
  );
}
