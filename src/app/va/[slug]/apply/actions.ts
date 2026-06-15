"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { getOrgBySlug, getAppForm, createApplication, getMembership, notify } from "@/lib/store";

export async function submitApplicationAction(slug: string, formData: FormData) {
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/");
  const user = await currentUser();
  if (!user) redirect(`/login?next=/va/${slug}/apply`);
  if (await getMembership(org!.id, user!.id)) redirect(`/va/${slug}/pilot`);

  const form = await getAppForm(org!.id);
  const answers: Record<string, string> = {};
  let quizTotal = 0, quizRight = 0;
  for (const q of form.questions) {
    const v = String(formData.get(q.id) || "").trim();
    answers[q.id] = v;
    if (q.type === "quiz") { quizTotal++; if (q.answer && v === q.answer) quizRight++; }
  }
  const score = quizTotal > 0 ? Math.round((quizRight / quizTotal) * 100) : null;

  await createApplication({ orgId: org!.id, userId: user!.id, ifcUsername: user!.ifcUsername, answers, score });
  revalidatePath(`/va/${slug}/crew/applications`);
  redirect(`/va/${slug}/apply?submitted=1`);
}
