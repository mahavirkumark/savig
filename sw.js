// sw.js (Service Worker File)

// Define the tag for the background sync event
const BIRTHDAY_SYNC_TAG = 'birthday-daily-check';

// 🚨 IMPORTANT: Replace with your actual Firebase config (only need projectId for REST API access)
const FIREBASE_PROJECT_ID = "sk12-58e9e"; 

self.addEventListener('install', (event) => {
  console.log('Service Worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
  event.waitUntil(self.clients.claim());
  
  // 1. Register Periodic Background Sync
  // This will try to run at least every 12 hours (minimum interval).
  event.waitUntil(
    self.registration.periodicSync.register(BIRTHDAY_SYNC_TAG, {
      minInterval: 12 * 60 * 60 * 1000, 
    }).then(() => {
      console.log('Periodic Background Sync registered for birthday checks.');
    }).catch(error => {
      console.error('Periodic Background Sync registration failed (User needs to install PWA):', error);
    })
  );
});


// 2. Listen for the periodic background sync event
self.addEventListener('periodicsync', (event) => {
  if (event.tag === BIRTHDAY_SYNC_TAG) {
    console.log('Periodic sync event triggered. Checking birthdays...');
    event.waitUntil(checkBirthdaysAndNotify());
  }
});


/**
 * Function to run the actual birthday check and show a notification.
 * This runs in the background.
 */
async function checkBirthdaysAndNotify() {
    const today = new Date();
    // October 7, 2025 is 10-7
    const todayMonthDayKey = `${today.getMonth() + 1}-${today.getDate()}`; 

    // --- REAL-WORLD FETCH (Replace MOCK DATA) ---
    // In a real app, you would securely fetch a list of today's birthdays 
    // from your database using a custom REST endpoint or Cloud Function.
    // Example: const response = await fetch(`https://your-api.com/today-birthdays`);
    
    // --- MOCK LOGIC FOR DEMONSTRATION ---
    // If today is 10-7, this notification will fire.
    const MOCK_BIRTHDAYS_DATA = [
        { name: 'Admin', birthdate: '2000-10-07' }, 
        { name: 'User 2', birthdate: '10-07' }
    ];
    
    const birthdaysToday = MOCK_BIRTHDAYS_DATA.filter(bday => {
        const birthdate = bday.birthdate.trim();
        let bdayKey;
        
        if (birthdate.length === 5) { // MM-DD
            const [m, d] = birthdate.split('-');
            bdayKey = `${parseInt(m)}-${parseInt(d)}`;
        } else if (birthdate.length === 10) { // YYYY-MM-DD
            const dateParts = birthdate.split('-');
            bdayKey = `${parseInt(dateParts[1])}-${parseInt(dateParts[2])}`;
        }
        
        return bdayKey === todayMonthDayKey;
    });
    // --- END MOCK LOGIC ---


    if (birthdaysToday.length > 0) {
        const namesList = birthdaysToday.map(bday => bday.name).join(' and ');
        const notificationTitle = `🎈 PWA Alert: Happy Birthday! 🎉`;
        const notificationBody = `Don't forget to wish ${namesList} a happy birthday!`;

        // Show the notification using the service worker's registration object
        return self.registration.showNotification(notificationTitle, {
            body: notificationBody,
            icon: '/images/icon-192x192.png', 
            tag: 'birthday-pwa-sync-check'
        });
    }
}