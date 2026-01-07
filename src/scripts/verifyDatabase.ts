
import { ref, get, getDatabase } from 'firebase/database';
import { initializeApp } from "firebase/app";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from context (assuming script run from root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function verifyDatabase() {
    console.log("Connecting to Firebase RTDB...");

    const dbRef = ref(db, 'tourist_spots');

    try {
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
            console.log("❌ NO DATA FOUND in 'tourist_spots' path!");
            process.exit(0);
        }

        const data = snapshot.val();
        const spots = Object.keys(data);

        console.log(`\n✅ Database contains ${spots.length} tourist spots:\n`);
        console.log("--------------------------------------------------");
        console.log(String("ID").padEnd(25) + String("Name").padEnd(30) + String("Geohash").padEnd(12) + "Location");
        console.log("--------------------------------------------------");

        spots.forEach(key => {
            const spot = data[key];
            const loc = `(${spot.location.lat.toFixed(4)}, ${spot.location.lng.toFixed(4)})`;
            console.log(
                key.slice(0, 24).padEnd(25) +
                spot.name.slice(0, 29).padEnd(30) +
                spot.geohash.padEnd(12) +
                loc
            );
        });
        console.log("--------------------------------------------------\n");

    } catch (error) {
        console.error("Error reading database:", error);
    }

    process.exit(0);
}

verifyDatabase();
