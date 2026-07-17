const CACHE_VERSION = "ifta-pwa-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const APP_SHELL = [
  "/",
  "/offline",
  "/services",
  "/pricing",
  "/contact",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];
const PUBLIC_PAGE_PATHS = new Set([
  "/",
  "/about",
  "/services",
  "/pricing",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/offline",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("ifta-pwa-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

function isProtectedPath(pathname) {
  return pathname.startsWith("/api/")
    || pathname.startsWith("/admin")
    || pathname.startsWith("/staff")
    || pathname.startsWith("/client");
}

function isStaticAsset(pathname) {
  return pathname.startsWith("/_next/static/")
    || pathname.startsWith("/icons/")
    || pathname.startsWith("/images/")
    || /\.(?:css|js|woff2?|png|jpg|jpeg|webp|svg|ico)$/.test(pathname);
}

function canCache(response) {
  if (!response || !response.ok || response.redirected || response.type === "opaque") return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !cacheControl.includes("no-store") && !cacheControl.includes("private");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (canCache(response)) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, allowCache) {
  try {
    const response = await fetch(request);
    if (allowCache && canCache(response)) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (allowCache && await caches.match(request))
      || await caches.match("/offline")
      || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(
      request,
      !isProtectedPath(url.pathname) && PUBLIC_PAGE_PATHS.has(url.pathname),
    ));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
