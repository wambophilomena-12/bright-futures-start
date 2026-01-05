// 1. UPDATE THESE VERSIONS to force an app-wide update
const STATIC_CACHE = 'realtravo-static-v8'; 
const IMAGE_CACHE = 'realtravo-images-v8';
const DATA_CACHE = 'realtravo-data-v8';

// 2. FILES TO DOWNLOAD IMMEDIATELY (The App Shell + All Routes from App.tsx)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/fulllogo.png',
  '/favicon.ico',
  
  // Public & Discovery
  '/auth',
  '/about',
  '/contact',
  '/saved',
  '/bookings',
  '/install',
  '/terms-of-service',
  '/privacy-policy',
  '/qr-scanner',
  
  // User Account
  '/profile',
  '/profile/edit',
  '/account',
  '/my-referrals',
  '/payment',
  '/payment-history',
  '/reset-password',
  '/verify-email',
  '/forgot-password',
  
  // Host / Provider
  '/become-host',
  '/creator-dashboard',
  '/my-listing',
  '/host-verification',
  '/verification-status',
  '/create-trip',
  '/create-hotel',
  '/create-adventure',
  '/create-attraction',
  '/host/trips',
  '/host/hotels',
  '/host/experiences',
  '/host-bookings',
  
  // Admin
  '/admin',
  '/admin/pending',
  '/admin/approved',
  '/admin/rejected',
  '/admin/bookings',
  '/admin/all-bookings',
  '/admin/verification',
  '/admin/payment-verification',
  '/admin/referral-settings'
];

const IMAGE_PATTERNS = [
  /supabase\.co\/storage\/v1\/object\/public\//,
  /images\.unsplash\.com/,
];

// --- INSTALL: Download everything now ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Realtravo: Precaching updated routes...');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// --- ACTIVATE: Delete old versions automatically ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, IMAGE_CACHE, DATA_CACHE].includes(key)) {
            console.log('Realtravo: Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- FETCH: Instant UI + Background Sync ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const isImage = IMAGE_PATTERNS.some(p => p.test(url.href)) || event.request.destination === 'image';
          
          // Determine cache bucket
          let cacheName = STATIC_CACHE;
          if (isImage) {
            cacheName = IMAGE_CACHE;
          } else if (url.pathname.includes('/rest/v1/')) {
            cacheName = DATA_CACHE;
          }

          const responseClone = networkResponse.clone();
          caches.open(cacheName).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for Navigation (SPA support)
        // If the user is offline and goes to a dynamic route (like /trip/paris), 
        // return index.html so React Router can take over.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// --- PUSH NOTIFICATIONS ---
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'New update from Realtravo',
    icon: '/fulllogo.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Realtravo', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data.url;
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});