#!/usr/bin/env python3
"""Add an installable PWA wrapper to the Expo static export on GitHub Pages."""
import json
import sys
from pathlib import Path

out = Path(sys.argv[1])
base = "/habit-hero/original-preview/"
manifest = {
    "name": "Habit Hero — Original Experience",
    "short_name": "Habit Hero",
    "description": "The complete Habit Hero family app powered by the original Expo source.",
    "id": base,
    "start_url": base,
    "scope": base,
    "display": "standalone",
    "background_color": "#F2F2F2",
    "theme_color": "#4A90E2",
    "icons": [
        {"src": base + "icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": base + "icon-512.png", "sizes": "512x512", "type": "image/png"}
    ]
}
(out / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
assets = Path("original/frontend/assets/images")
(out / "icon-192.png").write_bytes((assets / "favicon.png").read_bytes())
(out / "icon-512.png").write_bytes((assets / "icon.png").read_bytes())

for page in ("index.html", "404.html"):
    path = out / page
    text = path.read_text(encoding="utf-8")
    inject = (
        '<link rel="manifest" href="' + base + 'manifest.webmanifest">'
        '<meta name="theme-color" content="#4A90E2">'
        '<meta name="apple-mobile-web-app-capable" content="yes">'
        '<link rel="apple-touch-icon" href="' + base + 'icon-192.png">'
        '<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>'
        'navigator.serviceWorker.register("' + base + 'sw.js").catch(console.warn))}</script>'
    )
    text = text.replace("</head>", inject + "</head>")
    path.write_text(text, encoding="utf-8")

worker = """
const CACHE = 'habit-hero-original-v1';
const BASE = '/habit-hero/original-preview/';
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll([BASE, BASE+'index.html',
    BASE+'manifest.webmanifest', BASE+'icon-192.png', BASE+'icon-512.png']))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('habit-hero-original-')
    && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if(request.method !== 'GET' || url.origin !== self.location.origin ||
     !url.pathname.startsWith(BASE)) return;
  event.respondWith(
    fetch(request).then(response => {
      if(response.ok) caches.open(CACHE).then(c => c.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(r => r ||
      (request.mode === 'navigate' ? caches.match(BASE+'index.html') : Response.error())))
  );
});
"""
(out / "sw.js").write_text(worker, encoding="utf-8")
print("Prepared", out, "with PWA manifest, icons and service worker")
