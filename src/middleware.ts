import { NextRequest, NextResponse } from "next/server";

/* ----------------------------------------------------------------
   Custom-domain routing.

   A VA can point its own domain (flyskyline.com) at Stratos. This
   middleware reads the Host header and, for a known custom domain,
   rewrites the request to that VA's pages (/va/<slug>/…) WITHOUT
   changing the visible URL — so the airline's domain serves its
   fully-branded crew center with no "/va/…" in sight.

   Platform hosts (stratos-*.vercel.app, localhost) pass through
   untouched, so nothing changes for the platform itself.
------------------------------------------------------------------- */

function isPlatformHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".vercel.app")
  );
}

// best-effort per-instance cache of host → slug
const cache = new Map<string, { slug: string | null; at: number }>();
const TTL = 60_000;

// A self-reachable base URL for the internal resolver (the request origin is
// the *custom* domain, so we can't fetch that during dev).
function internalBase(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || "3500"}`;
}

async function resolveSlug(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL) return hit.slug;
  try {
    const res = await fetch(`${internalBase()}/api/resolve-domain?host=${encodeURIComponent(host)}`);
    const slug = res.ok ? ((await res.json()).slug ?? null) : null;
    cache.set(host, { slug, at: Date.now() });
    return slug;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!host || isPlatformHost(host)) return NextResponse.next();

  const slug = await resolveSlug(host);
  if (!slug) return NextResponse.next(); // unknown domain → serve platform as-is

  const path = req.nextUrl.pathname;
  if (path.startsWith("/va/")) return NextResponse.next(); // already canonical

  const url = req.nextUrl.clone();
  url.pathname = `/va/${slug}${path === "/" ? "" : path}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("x-custom-domain", host);
  return res;
}

export const config = {
  // run on pages, skip Next internals, the resolver API, and static files
  matcher: ["/((?!_next/|api/resolve-domain|.*\\.[\\w]+$).*)"],
};
