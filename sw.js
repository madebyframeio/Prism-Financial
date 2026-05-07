const CACHE_NAME = 'paypal-v1';
const ASSETS = [
    '/paypal/dashboard.html',
    '/paypal/wallet.html',
    '/paypal/send.html',
    '/utils.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
