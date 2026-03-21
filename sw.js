const CACHE_NAME = "golf-stats-v6";

const CORE_ASSETS = [
    "/",
    "/index.html",
    "/style.css",
    "/js/state.js",
    "/js/storage.js",
    "/js/app.js"
];

self.addEventListener("install", event => {
    console.log("SW install");

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CORE_ASSETS);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );

    self.clients.claim();
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});