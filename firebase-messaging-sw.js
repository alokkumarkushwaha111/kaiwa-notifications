importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyAKYQIdng7ISmE25baPuopCLq529OCOtvA",
  authDomain:"kaiwa-7d920.firebaseapp.com",
  projectId:"kaiwa-7d920",
  storageBucket:"kaiwa-7d920.firebasestorage.app",
  messagingSenderId:"663752332988",
  appId:"1:663752332988:web:f28c5e8de73be36946a2b9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New Message';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const fromUid = event.notification.data?.fromUid;
  event.waitUntil(
    clients.matchAll({type:'window'}).then(clientList => {
      for(const client of clientList){
        if(client.url.includes('netlify.app') && 'focus' in client){
          client.postMessage({type:'OPEN_CHAT', fromUid});
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
