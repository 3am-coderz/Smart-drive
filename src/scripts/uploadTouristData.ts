
import { ref, set, child, getDatabase } from "firebase/database";
import { initializeApp } from "firebase/app";
import * as geofire from 'geofire-common';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Using the config from firebaseConfig.ts (hardcoded here to rely on script execution context)
// Using environment variables
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

// Path to the JSON file - adjusting to be relative to where the script is run from project root
// Paths to the JSON files
const FILES = [
    path.resolve(process.cwd(), 'src/data/tourist_locations_updated.json'),
    path.resolve(process.cwd(), 'src/data/india1.json'),
    path.resolve(process.cwd(), 'src/data/india2.json'),
    path.resolve(process.cwd(), 'src/data/india3.json')
];

const uploadTouristData = async () => {
    console.log("Starting tourist data upload...");

    const allSpots: Record<string, any> = {};

    // 1. Merge all data
    for (const filePath of FILES) {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Warning: File not found at ${filePath}, skipping.`);
            continue;
        }
        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            Object.assign(allSpots, data);
            console.log(`Loaded ${Object.keys(data).length} spots from ${path.basename(filePath)}`);
        } catch (err) {
            console.error(`Error reading ${filePath}:`, err);
        }
    }

    const totalSpots = Object.keys(allSpots).length;
    console.log(`\nTotal spots to upload: ${totalSpots}`);

    if (totalSpots === 0) {
        console.error("No spots found in any file. Aborting.");
        process.exit(1);
    }

    const dbRef = ref(db, "tourist_spots");

    for (const [key, spot] of Object.entries(allSpots)) {
        // @ts-ignore
        const { name, category, tier, importance_score, city, state, verified, location } = spot;

        // Calculate geohash if not present or regenerate to be sure
        const lat = location.lat;
        const lng = location.lng;
        const hash = geofire.geohashForLocation([lat, lng]);

        const newSpot = {
            name,
            category,
            tier,
            importance_score,
            city,
            state: state || "Tamil Nadu",
            verified: !!verified,
            location: {
                lat,
                lng
            },
            geohash: hash,
            last_updated: new Date().toISOString()
        };

        const spotId = key; // Use the key from JSON as ID
        const spotRef = child(dbRef, spotId);

        await set(spotRef, newSpot);
        console.log(`✅ Uploaded: ${name} (${spotId}) -> ${hash}`);
    }

    console.log("\nAll spots uploaded successfully!");
    process.exit(0);
};

uploadTouristData();
