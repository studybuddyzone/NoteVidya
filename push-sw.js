// push-sw.js — Web Push service worker (replaces firebase-messaging-sw.js). Must live at site ROOT.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'StudyBuddy Notice';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || d.message || '',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    tag: d.noticeId ? String(d.noticeId) : undefined,
    data: { url: d.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (c.url.startsWith(self.location.origin) && 'focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
