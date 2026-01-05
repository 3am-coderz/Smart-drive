
import { ref, set, child, getDatabase } from "firebase/database";
import { initializeApp } from "firebase/app";
import * as geofire from 'geofire-common';
import * as fs from 'fs';
import * as path from 'path';

// Using the config from firebaseConfig.ts (hardcoded here to rely on script execution context)
const firebaseConfig = {
    apiKey: "AIzaSyD7dEziODl92Ip1_WGMEQZfYEoaVAFU9Us",
    authDomain: "tour-b15a4.firebaseapp.com",
    databaseURL: "https://tour-b15a4-default-rtdb.firebaseio.com/",
    projectId: "tour-b15a4",
    storageBucket: "tour-b15a4.firebasestorage.app",
    messagingSenderId: "583069041570",
    appId: "1:583069041570:web:92215a83440869250ce8fb",
    measurementId: "G-HGZKR84HT4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Path to the JSON file - adjusting to be relative to where the script is run from project root
const JSON_PATH = '/home/dk/Documents/academics/projects/geo/tourist_locations_updated.json';

const uploadTouristData = async () => {
    console.log("Starting tourist data upload...");

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`ERROR: File not found at ${JSON_PATH}`);
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
        const spots = JSON.parse(rawData);

        console.log(`Found ${Object.keys(spots).length} spots in JSON file.`);

        const dbRef = ref(db, "tourist_spots");

        for (const [key, spot] of Object.entries(spots)) {
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

    } catch (error) {
        console.error("Upload failed:", error);
        process.exit(1);
    }
};

uploadTouristData();
