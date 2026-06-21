import type { Branding, NavItem, Rank, Multiplier, Hub, Aircraft, OrgSettings, Codeshare, OrgModules } from "./types";

/* ----------------------------------------------------------------
   Theme engine. A VA's Branding compiles to CSS custom properties that
   the whole crew center reads — so every page repaints to their colors,
   font, radius and background with zero per-page work.
------------------------------------------------------------------- */

export type FontDef = {
  key: string;
  name: string;
  stack: string;
  google: string | null; // Google Fonts family spec, or null for system
};

export const FONT_CATALOG: FontDef[] = [
  { key: "inter", name: "Inter", stack: "'Inter', system-ui, sans-serif", google: "Inter:wght@300;400;500;600;700" },
  { key: "fraunces", name: "Fraunces (premium serif)", stack: "'Fraunces', Georgia, serif", google: "Fraunces:opsz,wght@9..144,300..700" },
  { key: "instrument-serif", name: "Instrument Serif (elegant)", stack: "'Instrument Serif', Georgia, serif", google: "Instrument+Serif:ital@0;1" },
  { key: "bricolage", name: "Bricolage Grotesque", stack: "'Bricolage Grotesque', system-ui, sans-serif", google: "Bricolage+Grotesque:opsz,wght@12..96,300..700" },
  { key: "montserrat", name: "Montserrat", stack: "'Montserrat', system-ui, sans-serif", google: "Montserrat:wght@200;300;400;500;600;700" },
  { key: "poppins", name: "Poppins", stack: "'Poppins', system-ui, sans-serif", google: "Poppins:wght@300;400;500;600;700" },
  { key: "sora", name: "Sora", stack: "'Sora', system-ui, sans-serif", google: "Sora:wght@300;400;500;600;700" },
  { key: "space-grotesk", name: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif", google: "Space+Grotesk:wght@300;400;500;600;700" },
  { key: "outfit", name: "Outfit", stack: "'Outfit', system-ui, sans-serif", google: "Outfit:wght@200;300;400;500;600;700" },
  { key: "dm-sans", name: "DM Sans", stack: "'DM Sans', system-ui, sans-serif", google: "DM+Sans:wght@300;400;500;600;700" },
  { key: "playfair", name: "Playfair Display", stack: "'Playfair Display', Georgia, serif", google: "Playfair+Display:wght@400;500;600;700" },
  { key: "lora", name: "Lora", stack: "'Lora', Georgia, serif", google: "Lora:wght@400;500;600;700" },
  { key: "jetbrains", name: "JetBrains Mono", stack: "'JetBrains Mono', ui-monospace, monospace", google: "JetBrains+Mono:wght@300;400;500;600;700" },
  { key: "system", name: "System Sans", stack: "system-ui, -apple-system, sans-serif", google: null },
];

export function fontStack(key: string): string {
  return (FONT_CATALOG.find((f) => f.key === key) || FONT_CATALOG[0]).stack;
}

/* Collect Google Fonts <link> hrefs needed for the chosen fonts. */
export function googleFontHref(keys: string[]): string | null {
  const fams = Array.from(new Set(keys))
    .map((k) => FONT_CATALOG.find((f) => f.key === k))
    .filter((f): f is FontDef => !!f && !!f.google)
    .map((f) => `family=${f!.google}`);
  if (!fams.length) return null;
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap`;
}

/* HSL helpers — build a full palette from a single hue + mode. */
export function brandingToCss(b: Branding): Record<string, string> {
  const h = b.hue;
  const a = b.accentHue;
  const dark = b.mode === "dark";
  const sat = b.saturation ?? 60; // palette colour intensity

  const bg = dark ? `hsl(${h} ${sat * 0.3}% 7%)` : `hsl(${h} ${sat * 0.4}% 97.5%)`;
  const surface = dark ? `hsl(${h} ${sat * 0.26}% 10.5%)` : `hsl(${h} ${sat * 0.36}% 99.5%)`;
  const surface2 = dark ? `hsl(${h} ${sat * 0.25}% 14.5%)` : `hsl(${h} ${sat * 0.33}% 94.5%)`;
  const border = dark ? `hsl(${h} ${sat * 0.23}% 20%)` : `hsl(${h} ${sat * 0.3}% 88%)`;
  const text = dark ? `hsl(${h} 30% 96%)` : `hsl(${h} 32% 12%)`;
  const textDim = dark ? `hsl(${h} 12% 68%)` : `hsl(${h} 14% 40%)`;
  const textFaint = dark ? `hsl(${h} 10% 46%)` : `hsl(${h} 10% 58%)`;
  const primary = `hsl(${h} ${sat + 10}% ${dark ? 62 : 46}%)`;
  const primarySoft = `hsl(${h} ${sat - 5}% ${dark ? 40 : 60}%)`;
  const accent = `hsl(${a} ${sat + 12}% ${dark ? 64 : 48}%)`;

  // feel knobs
  const density = b.density ?? "cozy";
  const space = density === "compact" ? 0.82 : density === "spacious" ? 1.22 : 1;
  const btnRadius = b.buttonShape === "pill" ? "999px" : b.buttonShape === "sharp" ? "4px" : `calc(${b.radius}px - 4px)`;
  const headerStyle = b.headerStyle ?? "blur";
  const headerBg = headerStyle === "solid" ? surface : headerStyle === "minimal" ? "transparent" : `color-mix(in srgb, ${surface} 78%, transparent)`;
  const headerBlur = headerStyle === "blur" ? "saturate(140%) blur(12px)" : "none";
  const headerBorder = headerStyle === "minimal" ? "transparent" : border;

  let pageBg = bg;
  if (b.bgType === "gradient") {
    const [g1, g2] = b.bgValue.split("|");
    const l1 = dark ? 9 : 96;
    const l2 = dark ? 6 : 92;
    pageBg = `linear-gradient(160deg, hsl(${g1 || h} 22% ${l1}%), hsl(${g2 || a} 20% ${l2}%))`;
  } else if (b.bgType === "image" && b.bgValue) {
    pageBg = `${dark ? "linear-gradient(hsl(0 0% 0% / 0.55), hsl(0 0% 0% / 0.65))," : "linear-gradient(hsl(0 0% 100% / 0.55), hsl(0 0% 100% / 0.6)),"} url(${b.bgValue}) center/cover fixed no-repeat`;
  }

  return {
    "--bg": bg,
    "--page-bg": pageBg,
    "--surface": surface,
    "--surface-2": surface2,
    "--border": border,
    "--text": text,
    "--text-dim": textDim,
    "--text-faint": textFaint,
    "--primary": primary,
    "--primary-soft": primarySoft,
    "--accent": accent,
    "--on-primary": dark ? `hsl(${h} 30% 8%)` : "hsl(0 0% 100%)",
    "--radius": `${b.radius}px`,
    "--btn-radius": btnRadius,
    "--space": String(space),
    "--header-bg": headerBg,
    "--header-blur": headerBlur,
    "--header-border": headerBorder,
    "--shadow": b.flat ? "none" : dark ? "0 1px 2px hsl(0 0% 0% / 0.4), 0 8px 24px hsl(0 0% 0% / 0.22)" : "0 1px 2px hsl(220 20% 40% / 0.08), 0 8px 24px hsl(220 20% 40% / 0.08)",
    "--font-body": fontStack(b.font),
    "--font-head": fontStack(b.headingFont),
  };
}

export function cssVarString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/* ---- defaults for a brand-new VA ---- */
export function defaultBranding(hue = 215): Branding {
  return {
    logoUrl: null,
    hue,
    accentHue: (hue + 40) % 360,
    mode: "dark",
    font: "inter",
    headingFont: "fraunces",
    radius: 14,
    bgType: "solid",
    bgValue: "",
    density: "cozy",
    buttonShape: "soft",
    headerStyle: "blur",
    saturation: 60,
    flat: false,
  };
}

export function defaultNav(): NavItem[] {
  return [
    { key: "home", label: "Home", href: "", enabled: true },
    { key: "routes", label: "Routes", href: "/routes", enabled: true },
    { key: "events", label: "Events", href: "/events", enabled: true },
    { key: "fleet", label: "Fleet", href: "/fleet", enabled: true },
    { key: "ranks", label: "Ranks", href: "/ranks", enabled: true },
    { key: "hubs", label: "Network", href: "/network", enabled: true },
    { key: "awards", label: "Awards", href: "/awards", enabled: true },
    { key: "shop", label: "Shop", href: "/shop", enabled: true },
    { key: "news", label: "News", href: "/news", enabled: true },
    { key: "roster", label: "Roster", href: "/roster", enabled: true },
    { key: "apply", label: "Apply", href: "/apply", enabled: true },
  ];
}

export function defaultCodeshares(): Codeshare[] {
  return [];
}

export function defaultRanks(): Rank[] {
  return [
    { id: "r1", label: "Cadet", hours: 0, note: "Welcome aboard" },
    { id: "r2", label: "Second Officer", hours: 25, note: "" },
    { id: "r3", label: "First Officer", hours: 75, note: "" },
    { id: "r4", label: "Senior First Officer", hours: 150, note: "" },
    { id: "r5", label: "Captain", hours: 300, note: "" },
    { id: "r6", label: "Senior Captain", hours: 600, note: "" },
    { id: "r7", label: "Line Training Captain", hours: 1200, note: "" },
    { id: "r8", label: "Fleet Captain", hours: 2500, note: "" },
    { id: "r9", label: "Commander", hours: 5000, note: "Top of the ladder" },
  ];
}

export function defaultMultipliers(): Multiplier[] {
  return [
    { code: "EVENT", value: 2, label: "Group event" },
    { code: "DOUBLE", value: 2, label: "Double hours weekend" },
    { code: "LONGHAUL", value: 1.5, label: "Long-haul bonus" },
  ];
}

export function defaultHubs(): Hub[] {
  return [{ id: "h1", icao: "EGLL", city: "London Heathrow", kind: "primary", departures: 40, destinations: 28 }];
}

export function defaultFleet(): Aircraft[] {
  return [
    { id: "f1", type: "A320neo", registration: "G-STR1", seats: 180, rangeNm: 3400, tagline: "Short-haul workhorse" },
    { id: "f2", type: "B787-9", registration: "G-STR2", seats: 296, rangeNm: 7600, tagline: "Long-haul flagship" },
  ];
}

export function defaultSettings(name: string): OrgSettings {
  return {
    tagline: "Fly with us.",
    about: `${name} is a virtual airline operating on Infinite Flight.`,
    allowPublicApply: true,
    requireApproval: true,
    pirepRequireReview: true,
    applyUrl: "",
    pointsPerHour: 100,
    pointsPerPirep: 50,
    bannerUrl: "",
    bannerVideo: false,
    discordWebhook: "",
    pirepWebhook: "",
    simbrief: true,
    currency: "miles",
    modules: { liveMap: false, analytics: false, ifVerify: false },
  };
}

/* Safe accessor — older orgs persisted before modules existed return all-off. */
export function orgModules(settings: { modules?: Partial<OrgModules> }): OrgModules {
  const m = settings?.modules || {};
  return { liveMap: !!m.liveMap, analytics: !!m.analytics, ifVerify: !!m.ifVerify };
}
