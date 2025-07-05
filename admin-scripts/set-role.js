
// admin-scripts/set-role.js

// Load environment variables from .env.local at the project root
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// Check if required environment variables are set
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Error: Firebase Admin SDK environment variables are not set.');
    console.error('Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are in your .env.local file.');
    process.exit(1);
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const [,, email, role] = process.argv;

if (!email || !role) {
    console.error('Usage: node admin-scripts/set-role.js <email> <role>');
    console.error('Example: node admin-scripts/set-role.js user@example.com admin');
    process.exit(1);
}

const validRoles = ['admin', 'receptionist', 'waiter', 'cashier'];
if (!validRoles.includes(role)) {
    console.error(`Invalid role: ${role}. Must be one of ${validRoles.join(', ')}.`);
    process.exit(1);
}

async function setCustomRole(email, role) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: role });
        console.log(`Success! Role '${role}' has been assigned to user ${email}.`);
        console.log('The user will see their new role the next time they log in.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`Error: User with email ${email} not found.`);
            console.error('Please make sure the user has already signed up in the application.');
        } else {
            console.error('Error setting custom claim:', error.message);
        }
        process.exit(1);
    }
}

setCustomRole(email, role);
