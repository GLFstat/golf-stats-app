const CACHE_NAME = "golf-stats-v7";

const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, "");

function withBase(path) {
    if (!path.startsWith("/")) return `${BASE_PATH}/${path}`;
    return `${BASE_PATH}${path}`;
}

const CORE_ASSETS = [
    withBase("/"),
    withBase("/index.html"),
    withBase("/style.css"),
    withBase("/manifest.json"),
    withBase("/js/state.js"),
    withBase("/js/storage.js"),
    withBase("/js/app.js"),

    // Splash / header / core visuals
    withBase("/images/splash-1.jpg"),
    withBase("/images/splash-2.png"),
    withBase("/images/Stracker-header-1.png"),
    withBase("/images/Stracker-header-2.png"),

    // Round background images used during play
    withBase("/images/golf-shot1.jpg"),
    withBase("/images/golf-shot1b.jpg"),
    withBase("/images/golf-shot2.jpg"),
    withBase("/images/golf-shot3.jpg"),
    withBase("/images/golf-shot4.jpg"),

    // PWA / app images you are likely to need
    withBase("/images/CartPath.png"),
    withBase("/images/PGA-mrkr.jpg")
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(CORE_ASSETS);
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
                    return Promise.resolve();
                })
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;

    // Only handle GET requests
    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // For page navigation, prefer cache fallback to index
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(async () => {
                    const cachedPage =
                        (await caches.match(request)) ||
                        (await caches.match(withBase("/index.html")));
                    return cachedPage;
                })
        );
        return;
    }

    // Cache-first for app assets
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then(networkResponse => {
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    request.url.startsWith(self.location.origin)
                ) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }

                return networkResponse;
            });
        })
    );
});