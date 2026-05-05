/* ==========================================================================
   川嶋メソッド PWA Service Worker v21
   - HTMLは network-first (古いキャッシュ問題を回避)
   - 静的アセットは cache-first
   - GAS APIへのアクセスはネットワーク優先（圏外時は即fail→indexのキューが拾う）
   ========================================================================== */
const VERSION = "v22.0.0-2026-05-05";
const CACHE = "kawashima-" + VERSION;
const STATIC_ASSETS = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  /* GAS（外部ドメイン）はキャッシュしない */
  if (url.hostname.endsWith("script.google.com") ||
      url.hostname.endsWith("googleusercontent.com")) {
    return;
  }

  /* GET 以外（POST 等）はキャッシュ対象外 */
  if (e.request.method !== "GET") return;

  /* HTML (index.html や / へのアクセス) は network-first */
  /* これにより、新バージョンが即座に反映される */
  const isHTML = e.request.mode === "navigate" ||
                 url.pathname.endsWith("/") ||
                 url.pathname.endsWith(".html");

  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match("./index.html")))
    );
    return;
  }

  /* 静的アセット (画像・JSON) は cache-first */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(res => {
        if (res && res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => null);
    })
  );
});
