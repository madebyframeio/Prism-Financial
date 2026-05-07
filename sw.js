const CACHE_NAME = 'paypal-v5'; // Incremented to match latest project version
const ASSETS = [
    '/paypal/dashboard.html',
    '/paypal/wallet.html',
    '/paypal/send.html',
    '/paypal/activity.html',
    '/paypal/add-money.html',
    '/paypal/receipt.html',
    '/paypal/login.html',
    '/paypal/dist/output.css',
    '/utils.js?v=v4',
    '/utils.js?v=v5'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
                );
            })
        ])
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    // For HTML files, use Network First strategy
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
    } else {
        // For other assets, use Cache First with revalidation
        e.respondWith(
            caches.match(e.request).then((res) => {
                const fetchPromise = fetch(e.request).then((networkRes) => {
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkRes.clone()));
                    return networkRes;
                });
                return res || fetchPromise;
            })
        );
    }
});
