import { redirect } from "next/navigation";
import PlatformHeader from "@/components/PlatformHeader";
import NewOrgForm from "@/components/NewOrgForm";
import { currentUser } from "@/lib/auth";

export default async function NewOrgPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/new");
  return (
    <>
      <PlatformHeader />
      <main className="container-x" style={{ maxWidth: 520, paddingTop: 56, paddingBottom: 80 }}>
        <span className="eyebrow">New crew center</span>
        <h1 style={{ fontSize: "2rem", margin: "0.4rem 0 0.3rem" }}>Stand up your airline</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Two fields and a colour to get airborne. Everything else is customizable later.</p>
        <NewOrgForm />
      </main>
    </>
  );
}
