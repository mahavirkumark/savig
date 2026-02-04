// firebase-messaging-sw.js
// This script runs in the background.

importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// 1. Initialize Firebase (MUST use the exact same config as your daily.html)
const firebaseConfig = {
    apiKey: "AIzaSyB78RTVCg0cmSPp7A1RJyyAgBuCeolO0cc", // 👈 REPLACE
    authDomain: "sk12-58e9e.firebaseapp.com", // 👈 REPLACE
    projectId: "sk12-58e9e", // 👈 REPLACE
    storageBucket: "sk12-58e9e.appspot.com", // 👈 REPLACE
    messagingSenderId: "470207874652", // 👈 REPLACE
    appId: "1:470207874652:web:67ba1cf3629b7e5b144899" // 👈 REPLACE
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// 2. Handle incoming push messages when the app is NOT open
messaging.onBackgroundMessage(function(payload) {
    const notificationTitle = payload.notification.title || 'Task Reminder';
    const notificationOptions = {
        body: payload.notification.body || 'You have pending tasks!',
        icon: '/icon-192x192.png',
        data: {
            url: '/daily.html' // **Uses your correct page name**
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Handle notification clicks (opens the task page)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/daily.html'; // **Uses your correct page name**

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // Update the URL check to match the new filename
                if (client.url.endsWith('daily.html') && 'focus' in client) { 
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});