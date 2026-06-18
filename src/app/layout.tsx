import type { Metadata } from "next";
import "./globals.css";
import { getControl } from "@/lib/control";

export const metadata: Metadata = {
  title: "Stratos — every VA's crew center, your way",
  description: "The platform that powers virtual airline crew centers. Brand it, run it, make it yours.",
  icons: { icon: "/brand/icon-512.png", apple: "/brand/icon-180.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const control = await getControl();
  const offline = control && control.status !== "operational";

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Jost:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {offline ? (
          <MaintenanceScreen
            name="Stratos"
            status={control!.status}
            message={control!.message}
          />
        ) : (
          children
        )}
      </body>
    </html>
  );
}

function MaintenanceScreen({
  name,
  status,
  message,
}: {
  name: string;
  status: "operational" | "maintenance" | "down";
  message: string;
}) {
  const heading = status === "down" ? "Temporarily offline" : "Down for maintenance";
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b1020",
        color: "#eef1f7",
        fontFamily: "Jost, Inter, ui-sans-serif, system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "30rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "999px",
            padding: "0.35rem 0.85rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#c9a84c",
          }}
        >
          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "999px", background: "#c9a84c" }} />
          {name}
        </div>
        <h1 style={{ marginTop: "1.5rem", fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.1, fontFamily: "Fraunces, serif" }}>
          {heading}
        </h1>
        <p style={{ marginTop: "1rem", color: "rgba(238,241,247,0.7)", lineHeight: 1.6 }}>
          {message || "We're making things better and will be back shortly. Thanks for your patience."}
        </p>
      </div>
    </main>
  );
}
