// set-role.js
const admin = require('firebase-admin');
// IMPORTANT: Replace with the path to your service account key
const serviceAccount = require('./reservas-email-ly2pa-firebase-adminsdk-fbsvc-5fcf460a86.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const adminEmail = 'xabier@gmail.com'; // The email of the user to modify
const adminRole = 'admin'; // The role to assign: 'admin', 'receptionist', or 'waiter'
const receptionEmail = 'recepcion@gmail.com';
const receptionRole = 'receptionist';
const waiterEmail = 'mesero@gmail.com';
const waiterRole = 'waiter';

async function setCustomRole(email, role) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: role });
        console.log(`Success! Custom claim '${role}' set for user ${email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error setting custom claim:', error);
        process.exit(1);
    }
}

setCustomRole(adminEmail, adminRole);
setCustomRole(receptionEmail, receptionRole);
setCustomRole(waiterEmail, waiterRole);