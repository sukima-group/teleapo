/* ==========================================================================
   川嶋メソッド PWA Service Worker v94
   - HTMLは network-first (古いキャッシュ問題を回避)
   - 静的アセットは cache-first (バックグラウンド更新)
   - install時に全ての旧キャッシュを強制削除
   - skipWaiting + clients.claim で即座に新SWを適用
   ========================================================================== */
const VERSION = "v94.0.0-2026-08-14";
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

/* v82: 共有メニュー（My Files → 共有 → 川嶋メソッド）から録音を受け取る */
self.addEventListener("fetch", e => {
  const u0 = new URL(e.request.url);
  if (e.request.method === "POST" && u0.searchParams.has("sharetarget")) {
    e.respondWith((async () => {
      try {
        const form = await e.request.formData();
        const files = form.getAll("recordings") || [];
        const cache = await caches.open("shared-recordings");
        const names = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (!f || !f.name) continue;
          const key = "/__shared__/" + Date.now() + "_" + i + "_" + encodeURIComponent(f.name);
          await cache.put(new Request(key), new Response(f, {
            headers: { "Content-Type": f.type || "audio/mp4", "X-File-Name": encodeURIComponent(f.name) }
          }));
          names.push(key);
        }
        const clientsList = await self.clients.matchAll({ type: "window" });
        clientsList.forEach(c => c.postMessage({ type: "shared-recordings", keys: names }));
        return Response.redirect("./?shared=" + names.length, 303);
      } catch (err) {
        return Response.redirect("./?shared=0", 303);
      }
    })());
    return;
  }
  const url = u0;

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
