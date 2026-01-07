
import { ref, query, orderByChild, startAt, endAt, get, getDatabase } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import * as geofire from 'geofire-common';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
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

// --- UTILS ---
interface LatLng { lat: number; lng: number; }

const POI_SEARCH_RADIUS = 20000; // 20km

const getRouteQueryBounds = (sampledPoints: LatLng[], radiusMeters: number) => {
    const queries: string[][] = [];
    for (const point of sampledPoints) {
        const center: geofire.Geopoint = [point.lat, point.lng];
        const bounds = geofire.geohashQueryBounds(center, radiusMeters);
        queries.push(...bounds);
    }
    const uniqueQueries = new Map<string, string[]>();
    for (const q of queries) {
        const key = `${q[0]}-${q[1]}`;
        uniqueQueries.set(key, q);
    }
    return Array.from(uniqueQueries.values());
};

// --- DATA ---
// Simulating points on Chennai to Madurai route
const SAMPLE_POINTS = [
    { lat: 13.0827, lng: 80.2707 }, // Chennai
    { lat: 12.6200, lng: 80.1900 }, // Near Mahabalipuram (Shore Temple)
    { lat: 10.7900, lng: 79.1300 }, // Near Thanjavur (Brihadeeswarar)
    { lat: 9.9391, lng: 78.1217 }   // Madurai (Meenakshi)
];

async function runVerify() {
    console.log("=== STARTING VERIFICATION ===");
    console.log(`Checking ${SAMPLE_POINTS.length} sample points against DB...`);

    const bounds = getRouteQueryBounds(SAMPLE_POINTS, POI_SEARCH_RADIUS);
    console.log(`Generated ${bounds.length} geohash bounds.`);

    const dbRef = ref(db, 'tourist_spots');
    const promises = bounds.map(b => {
        const q = query(dbRef, orderByChild('geohash'), startAt(b[0]), endAt(b[1]));
        return get(q);
    });

    const snapshots = await Promise.all(promises);

    let logBuffer = "=== GEOHASH COMPARISON LOG ===\n";
    logBuffer += `Radius: ${POI_SEARCH_RADIUS}m\n`;
    logBuffer += `Generated: ${new Date().toISOString()}\n\n`;
    logBuffer += "Sample Points (Route Spine):\n";
    SAMPLE_POINTS.forEach((p, i) => {
        const h = geofire.geohashForLocation([p.lat, p.lng]);
        logBuffer += `  Point ${i + 1}: ${p.lat}, ${p.lng} (Hash: ${h})\n`;
    });
    logBuffer += "\n--- DATABASE MATCHES ---\n";

    let foundCount = 0;
    const foundIds = new Set<string>();

    for (const snap of snapshots) {
        if (!snap.exists()) continue;
        const val = snap.val();

        Object.keys(val).forEach(key => {
            if (foundIds.has(key)) return;
            foundIds.add(key);

            const data = val[key];

            // Distance Check
            let closestDist = Infinity;
            let closestSampleHash = "N/A";
            let closestSampleIdx = -1;

            for (let i = 0; i < SAMPLE_POINTS.length; i++) {
                const sample = SAMPLE_POINTS[i];
                const dist = geofire.distanceBetween(
                    [data.location.lat, data.location.lng],
                    [sample.lat, sample.lng]
                ) * 1000;

                if (dist < closestDist) {
                    closestDist = dist;
                    closestSampleIdx = i;
                    closestSampleHash = geofire.geohashForLocation([sample.lat, sample.lng]);
                }
            }

            const isCovered = closestDist <= POI_SEARCH_RADIUS;

            // Log entry
            const status = isCovered ? "MATCH" : "IGNORED (Too Far)";
            logBuffer += `[${status}] Name: ${data.name}\n`;
            logBuffer += `   DB Hash:      ${data.geohash}\n`;
            logBuffer += `   Closest Sample: Point ${closestSampleIdx + 1} (${closestSampleHash})\n`;
            logBuffer += `   Distance:     ${closestDist.toFixed(2)}m\n`;
            logBuffer += `   Location:     ${data.location.lat}, ${data.location.lng}\n`;
            logBuffer += "--------------------------------------------------\n";

            if (isCovered) foundCount++;
        });
    }

    logBuffer += `\nTotal Unique Spots Found within ${POI_SEARCH_RADIUS}m: ${foundCount}\n`;

    // Write to file
    const outputPath = path.resolve('comparison_log.txt');
    try {
        fs.writeFileSync(outputPath, logBuffer);
        console.log(`=== LOG SAVED TO: ${outputPath} ===`);
    } catch (e) {
        console.error("Failed to write log file:", e);
    }

    console.log(`Found ${foundCount} matches.`);
    process.exit(0);
}

runVerify();
