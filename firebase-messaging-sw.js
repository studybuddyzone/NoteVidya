// firebase-messaging-sw.js
// Must live at the site ROOT (same level as fy) — the browser requires
// the FCM service worker's scope to cover every page that registers it.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCZhDPaVY7jv_hXtHdpVqUcGe1hwAxvZmc",
  authDomain: "students-e5183.firebaseapp.com",
  databaseURL: "https://students-e5183-default-rtdb.firebaseio.com",
  projectId: "students-e5183",
  storageBucket: "students-e5183.firebasestorage.app",
  messagingSenderId: "473442117683",
  appId: "1:473442117683:web:f39adc0665317aa95e9b46"
});

const messaging = firebase.messaging();
const FALLBACK_ICON = "/assets/icon-192.png";

// Fires when a push arrives while the site is closed / tab is backgrounded.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = (payload.notification && payload.notification.title) || data.title || 'StudyBuddy Notice';
  const body = (payload.notification && payload.notification.body) || data.message || '';

  self.registration.showNotification(title, {
    body: body,
    icon: FALLBACK_ICON,
    badge: FALLBACK_ICON,
    tag: data.noticeId || undefined, // replaces older notification with the same id instead of stacking dupes
    data: { url: data.actionUrl || '/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
