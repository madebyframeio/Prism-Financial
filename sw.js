const CACHE_NAME = 'paypal-v6';
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
    // Skip non-GET requests and Supabase API calls
    if (e.request.method !== 'GET' || e.request.url.includes('supabase.co')) return;

    const url = new URL(e.request.url);
    
    // For HTML files (navigation), use Network First strategy
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    if (!res || res.status !== 200 || res.type !== 'basic') return res;
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
    } else {
        // For other assets, use Stale-While-Revalidate
        e.respondWith(
            caches.match(e.request).then((cachedRes) => {
                const fetchPromise = fetch(e.request).then((networkRes) => {
                    if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') {
                        return networkRes;
                    }
                    try {
                        const networkClone = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkClone));
                    } catch (err) {
                        console.warn('[SW] Clone failed', err);
                    }
                    return networkRes;
                }).catch(() => null);

                return cachedRes || fetchPromise;
            })
        );
    }
});
