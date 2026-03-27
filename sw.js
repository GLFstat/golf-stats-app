const CACHE_NAME = "golf-stats-v9999";

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

    // Splash / header / key images
    withBase("/images/splash-1.jpg"),
    withBase("/images/splash-2.png"),
    withBase("/images/Stracker-header-1.png"),
    withBase("/images/Stracker-header-2.png"),
    withBase("/images/Round-details-1.jpg"),

    // Golf backgrounds
// Golf backgrounds
withBase("/images/golf-shot1.jpg"),
withBase("/images/golf-shot1b.jpg"),
withBase("/images/golf-shot2.jpg"),
withBase("/images/golf-shot3.jpg"),
withBase("/images/golf-shot4.jpg"),
withBase("/images/golf-shot6.jpg"),
withBase("/images/golf-shot10.jpg"),

    // Other app images you’ve used
    withBase("/images/CartPath.png"),
    withBase("/images/PGA-mrkr.jpg")
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
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

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // only same-origin requests
    if (url.origin !== self.location.origin) return;

    // page navigation fallback
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(async () => {
                    return (
                        (await caches.match(request)) ||
                        (await caches.match(withBase("/index.html")))
                    );
                })
        );
        return;
    }

    // cache-first for assets
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => {
                    // final fallback for missed app-shell requests
                    if (request.destination === "document") {
                        return await caches.match(withBase("/index.html"));
                    }
                    return Response.error();
                });
        })
    );
});