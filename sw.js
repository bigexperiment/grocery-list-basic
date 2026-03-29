/* grocery list — offline shell; API calls still need network */
var VERSION = "grocery-list-pwa-2";

var PRECACHE_URLS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return Promise.all(
        PRECACHE_URLS.map(function (path) {
          return cache.add(new Request(path, { cache: "reload" })).catch(function () {});
        })
      );
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== VERSION) return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  try {
    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
  } catch (e) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        var copy = res.clone();
        if (res.status === 200) {
          caches.open(VERSION).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(event.request).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
  );
});
