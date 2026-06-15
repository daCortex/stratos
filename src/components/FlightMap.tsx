"use client";

import { useEffect, useRef } from "react";

export type MapRoute = { from: [number, number]; to: [number, number]; label?: string };
export type MapMarker = { at: [number, number]; label: string; kind?: "hub" | "dest" | "plane" };

/* Leaflet map for routes / arrivals / live flights. Loaded purely client-side. */
export default function FlightMap({ routes = [], markers = [], height = 420 }: { routes?: MapRoute[]; markers?: MapMarker[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      // inject leaflet css once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(ref.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 10 }).addTo(map);

      const pts: [number, number][] = [];
      const gold = "#C9A84C";

      for (const r of routes) {
        L.polyline([r.from, r.to], { color: gold, weight: 1.6, opacity: 0.7 }).addTo(map);
        pts.push(r.from, r.to);
      }
      const dot = (color: string, size = 9) => L.divIcon({ className: "", html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 0 2px rgba(13,27,42,.8)"></div>`, iconSize: [size, size] });
      for (const m of markers) {
        const color = m.kind === "hub" ? gold : m.kind === "plane" ? "#7DD8A8" : "#D4D8DC";
        L.marker(m.at, { icon: dot(color, m.kind === "hub" ? 12 : 9) }).addTo(map).bindTooltip(m.label, { direction: "top" });
        pts.push(m.at);
      }

      if (pts.length) {
        const bounds = L.latLngBounds(pts as any);
        map.fitBounds(bounds.pad(0.25), { maxZoom: 6 });
      } else {
        map.setView([30, 0], 2);
      }
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [JSON.stringify(routes), JSON.stringify(markers)]);

  return <div ref={ref} style={{ height, width: "100%", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }} />;
}
