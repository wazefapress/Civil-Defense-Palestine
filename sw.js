const CACHE_NAME = 'civil-defense-v1';

// الموارد المحلية الأساسية الضامنة لتشغيل الـ PWA
const LOCAL_ASSETS = [
  './',
  './index.html',
  './data.json',
  './manifest.json',
  './icon192.png',
  './icon512.png'
];

// الموارد الخارجية
const EXTERNAL_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// 1. التثبيت والتخزين بمرونة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching local core assets');
      await cache.addAll(LOCAL_ASSETS);
      
      // التخزين الفردي للموارد الخارجية دون إيقاف التثبيت في حال الفشل
      EXTERNAL_ASSETS.forEach(async (url) => {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[SW] Could not pre-cache external asset:', url);
        }
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. تنشيط وتطهير التخزين القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. استراتيجية Network First / Cache Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});