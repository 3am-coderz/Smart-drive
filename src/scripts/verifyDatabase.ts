
import { ref, get, getDatabase } from 'firebase/database';
import { initializeApp } from "firebase/app";

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
