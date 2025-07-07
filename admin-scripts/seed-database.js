// admin-scripts/seed-database.js

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Check for Firebase config
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Error: Firebase Admin SDK environment variables are not set.');
    process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

// --- Sample Data ---

const tables = [
  { name: 'Bar 1', capacity: 1, status: 'Available' },
  { name: 'Bar 2', capacity: 1, status: 'Available' },
  { name: 'Window 1', capacity: 2, status: 'Available' },
  { name: 'Window 2', capacity: 2, status: 'Available' },
  { name: 'Table 1', capacity: 4, status: 'Available' },
  { name: 'Table 2', capacity: 4, status: 'Available' },
  { name: 'Table 3', capacity: 4, status: 'Available' },
  { name: 'Booth 1', capacity: 6, status: 'Available' },
  { name: 'Booth 2', capacity: 6, status: 'Available' },
  { name: 'Patio 1', capacity: 4, status: 'Available' },
  { name: 'Patio 2', capacity: 4, status: 'Available' },
  { name: 'Private Room', capacity: 10, status: 'Available' },
];

const menuItems = [
  // Appetizers
  { name: 'Bruschetta', category: 'Appetizers', price: 8.99 },
  { name: 'Calamari Fritti', category: 'Appetizers', price: 12.50 },
  { name: 'Spinach Artichoke Dip', category: 'Appetizers', price: 10.00 },

  // Main Courses
  { name: 'Filet Mignon', category: 'Main Courses', price: 35.00 },
  { name: 'Grilled Salmon', category: 'Main Courses', price: 26.50 },
  { name: 'Chicken Parmesan', category: 'Main Courses', price: 22.00 },
  { name: 'Lobster Ravioli', category: 'Main Courses', price: 28.75 },
  { name: 'Vegan Burger', category: 'Main Courses', price: 18.00 },
  
  // Desserts
  { name: 'Tiramisu', category: 'Desserts', price: 9.00 },
  { name: 'Chocolate Lava Cake', category: 'Desserts', price: 9.50 },
  { name: 'New York Cheesecake', category: 'Desserts', price: 8.50 },

  // Drinks
  { name: 'Coca-Cola', category: 'Drinks', price: 3.50 },
  { name: 'Sparkling Water', category: 'Drinks', price: 4.00 },
  { name: 'House Red Wine', category: 'Drinks', price: 10.00 },
  { name: 'House White Wine', category: 'Drinks', price: 10.00 },
];

// --- Seeding Functions ---

async function seedCollection(collectionName, data) {
    console.log(`Checking collection: ${collectionName}...`);
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.limit(1).get();

    if (!snapshot.empty) {
        console.log(`Collection "${collectionName}" is not empty. Skipping seed.`);
        return;
    }

    console.log(`Seeding ${collectionName}...`);
    const batch = db.batch();
    data.forEach(item => {
        const docRef = collectionRef.doc();
        batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`Successfully seeded ${data.length} documents into "${collectionName}".`);
}

async function main() {
    try {
        console.log('Starting database seeding process...');
        await seedCollection('tables', tables);
        await seedCollection('menuItems', menuItems);
        console.log('Database seeding finished successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during database seeding:', error);
        process.exit(1);
    }
}

main();
