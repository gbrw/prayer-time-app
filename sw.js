const CACHE = "iraq-prayer-times-v1";
const APP_SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))));
self.addEventListener("fetch", event => { if (event.request.url.includes("/api/")) return; event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
