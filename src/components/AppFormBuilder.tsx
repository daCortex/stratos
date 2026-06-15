"use client";

import { useState } from "react";
import type { ApplicationForm, AppQuestion } from "@/lib/types";
import { saveAppFormAction } from "@/app/va/[slug]/crew/actions";

const uid = () => Math.random().toString(36).slice(2, 9);

export default function AppFormBuilder({ slug, form }: { slug: string; form: ApplicationForm }) {
  const [enabled, setEnabled] = useState(form.enabled);
  const [intro, setIntro] = useState(form.intro);
  const [passScore, setPassScore] = useState(form.passScore);
  const [qs, setQs] = useState<AppQuestion[]>(form.questions);

  const setQ = (i: number, p: Partial<AppQuestion>) => setQs((arr) => arr.map((q, j) => (j === i ? { ...q, ...p } : q)));

  return (
    <form action={saveAppFormAction.bind(null, slug)} className="card" style={{ padding: "1.4rem", display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Application form builder</h3>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
          <input type="checkbox" name="enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Accepting applications
        </label>
      </div>
      <div><label className="label">Intro text</label><textarea name="intro" className="input" rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} /></div>
      <div><label className="label">Quiz pass score (%) — auto-flag below this</label><input name="passScore" type="number" className="input" style={{ width: 100 }} value={passScore} onChange={(e) => setPassScore(+e.target.value)} /></div>

      <div style={{ display: "grid", gap: 10 }}>
        {qs.map((q, i) => (
          <div key={q.id} className="card-2" style={{ padding: "1rem", display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} placeholder="Question" style={{ flex: 1 }} />
              <select className="input" value={q.type} onChange={(e) => setQ(i, { type: e.target.value as AppQuestion["type"] })} style={{ width: 130 }}>
                <option value="text">Short text</option><option value="long">Paragraph</option><option value="choice">Multiple choice</option><option value="quiz">Quiz (graded)</option>
              </select>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#e0556a" }} onClick={() => setQs((arr) => arr.filter((_, j) => j !== i))}>✕</button>
            </div>
            {(q.type === "choice" || q.type === "quiz") && (
              <input className="input" value={q.options.join(", ")} onChange={(e) => setQ(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Options, comma separated" />
            )}
            {q.type === "quiz" && (
              <input className="input" value={q.answer || ""} onChange={(e) => setQ(i, { answer: e.target.value })} placeholder="Correct answer (must match an option exactly)" />
            )}
            <label style={{ fontSize: "0.8rem", display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={q.required} onChange={(e) => setQ(i, { required: e.target.checked })} /> Required</label>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost btn-sm" style={{ justifySelf: "start" }} onClick={() => setQs((arr) => [...arr, { id: uid(), label: "", type: "text", options: [], answer: null, required: true }])}>+ Add question</button>

      <input type="hidden" name="questions" value={JSON.stringify(qs)} />
      <button className="btn btn-primary" type="submit">Save form</button>
    </form>
  );
}
