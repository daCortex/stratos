/* Minimal, dependency-free CSV. Handles quoted fields, commas and newlines. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function parseCsvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

/* Pull a value by any of several possible header names (import flexibility). */
export function pick(o: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k.toLowerCase()];
    if (v != null && v !== "") return v;
  }
  return "";
}

/* Parse "hours" that may be "12.5", "12:30", or minutes — return minutes. */
export function toMinutes(raw: string): number {
  const v = raw.trim();
  if (!v) return 0;
  if (v.includes(":")) {
    const [h, m] = v.split(":");
    return Math.round((parseInt(h) || 0) * 60 + (parseInt(m) || 0));
  }
  const n = parseFloat(v);
  if (isNaN(n)) return 0;
  // Heuristic: a value over 1000 is probably already minutes.
  return n > 1000 ? Math.round(n) : Math.round(n * 60);
}
