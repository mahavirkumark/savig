// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (it's automatically authenticated in Cloud Functions)
admin.initializeApp();
const db = admin.database();

/**
 * Helper to get the current Month-Day key for comparison (e.g., "10-1").
 */
function getMonthDayKey(date) {
    // Returns month and day without leading zeros for robustness (e.g., "9-5")
    return `${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Scheduled function to check all users' birthdays and send FCM notifications.
 * Runs once a day, for example, at 9:00 AM UTC (adjust to your local time)
 */
exports.birthdayChecker = functions.pubsub.schedule('0 9 * * *')
    .timeZone('America/New_York') // Set to a time zone that makes sense for your users
    .onRun(async (context) => {
        const today = new Date();
        const todayMonthDayKey = getMonthDayKey(today);
        console.log(`Starting daily birthday check for key: ${todayMonthDayKey}`);

        try {
            // 1. Fetch ALL user data from the database
            const snapshot = await db.ref('users').once('value');
            const users = snapshot.val();

            if (!users) {
                console.log("No users found in database.");
                return null;
            }

            // A list to hold all push notification messages
            const messages = [];

            // 2. Iterate through every user
            for (const userId in users) {
                const userData = users[userId];
                const fcmTokens = userData.fcmTokens;
                const birthdays = userData.birthdays || {};

                if (!fcmTokens) {
                    continue; // Skip user if they haven't saved an FCM token
                }
                
                // 3. Find today's birthdays for this user
                const birthdaysToday = Object.values(birthdays).filter(bday => {
                    // Replicate the client-side parsing logic
                    if (!bday || !bday.birthdate) return false;
                    const birthdate = bday.birthdate.trim();
                    let bdayKey;

                    if (birthdate.length === 5) { // MM-DD
                        const [m, d] = birthdate.split('-');
                        bdayKey = `${parseInt(m)}-${parseInt(d)}`;
                    } else if (birthdate.length === 10) { // YYYY-MM-DD
                        const dateParts = birthdate.split('-');
                        const m = dateParts[1];
                        const d = dateParts[2];
                        bdayKey = `${parseInt(m)}-${parseInt(d)}`;
                    } else {
                        return false;
                    }

                    return bdayKey === todayMonthDayKey;
                });

                // 4. Create an FCM message if birthdays are found
                if (birthdaysToday.length > 0) {
                    let notificationTitle;
                    let notificationBody;

                    if (birthdaysToday.length === 1) {
                        notificationTitle = `🎂 Happy Birthday to ${birthdaysToday[0].name}! 🎉`;
                        notificationBody = `Don't forget to wish them a great day!`;
                    } else {
                        notificationTitle = `🎈 Multiple Birthdays Today! (${birthdaysToday.length} people) 🎁`;
                        // List only the first few names in the body
                        const namesList = birthdaysToday.map(bday => bday.name).slice(0, 3).join(', ');
                        notificationBody = `Today: ${namesList} and more!`;
                    }

                    // Get all valid tokens for this user
                    const validTokens = Object.keys(fcmTokens);

                    // Create the message object for each token
                    const messagePayload = {
                        notification: {
                            title: notificationTitle,
                            body: notificationBody,
                            icon: '/firebase-logo.png' // A simple icon path
                        },
                        // The 'token' property will be added dynamically below
                    };

                    // Add a message for each token
                    validTokens.forEach(token => {
                        messages.push({ ...messagePayload, token: token });
                    });
                }
            }
            
            // 5. Send all collected messages in a batch
            if (messages.length > 0) {
                console.log(`Sending ${messages.length} notifications...`);
                // Use sendAll for efficiency
                const response = await admin.messaging().sendAll(messages);
                console.log('Successfully sent messages:', response.successCount);
            } else {
                console.log("No birthdays to notify today.");
            }

            return null;

        } catch (error) {
            console.error("Error running birthday check:", error);
            return null;
        }
    });