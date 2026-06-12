/* ==========================================================================
   川嶋メソッド PWA Service Worker v26
   - HTMLは network-first (古いキャッシュ問題を回避)
   - 静的アセットは cache-first (バックグラウンド更新)
   - install時に全ての旧キャッシュを強制削除
   - skipWaiting + clients.claim で即座に新SWを適用
   ========================================================================== */
const VERSION = "v31.0.0-2026-06-12";
const CACHE = "kawashima-" + VERSION;
const STATIC_ASSETS = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  console.log("[SW] Installing " + VERSION);
  self.skipWaiting(); /* 即座に新SWを有効化 */
  e.waitUntil(
    /* 旧キャッシュを全て削除してからキャッシュ */
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => {
        console.log("[SW] Deleting old cache: " + k);
        return caches.delete(k);
      })
    )).then(() => caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)))
  );
});

self.addEventListener("activate", e => {
  console.log("[SW] Activating " + VERSION);
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim()) /* 即座に全タブを制御 */
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  /* GAS（外部ドメイン）はキャッシュしない */
  if (url.hostname.endsWith("script.google.com") ||
      url.hostname.endsWith("googleusercontent.com")) {
    return;
  }

  /* GET 以外はキャッシュ対象外 */
  if (e.request.method !== "GET") return;

  /* HTML (index.html や / へのアクセス) は network-first */
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

  /* 静的アセット (画像・JSON) は cache-first + バックグラウンド更新 */
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
