import { ref, push, set, child } from "firebase/database";
import { db } from "../services/firebaseConfig";
import * as geofire from 'geofire-common';
import { TouristSpot } from "../types/firestore";

// Sample Data for Tamil Nadu
// In a real app, this would come from a CSV or external API
const RAW_SPOTS = [
    { name: "Meenakshi Amman Temple", city: "Madurai", lat: 9.9195, lng: 78.1193, tier: "tier1" as const, category: "religious" as const },
    { name: "Brihadeeswarar Temple", city: "Thanjavur", lat: 10.7828, lng: 79.1318, tier: "tier1" as const, category: "historic" as const },
    { name: "Marina Beach", city: "Chennai", lat: 13.0500, lng: 80.2824, tier: "tier2" as const, category: "nature" as const },
    { name: "Shore Temple", city: "Mahabalipuram", lat: 12.6167, lng: 80.1917, tier: "tier1" as const, category: "historic" as const },
    { name: "Nilgiri Mountain Railway", city: "Ooty", lat: 11.4064, lng: 76.6932, tier: "tier2" as const, category: "viewpoint" as const },
    { name: "Kanyakumari Point", city: "Kanyakumari", lat: 8.0780, lng: 77.5410, tier: "tier1" as const, category: "landmark" as const },
    { name: "Dhanushkodi Beach", city: "Rameswaram", lat: 9.1784, lng: 79.4142, tier: "tier2" as const, category: "nature" as const },
    { name: "Fort St. George", city: "Chennai", lat: 13.0796, lng: 80.2874, tier: "tier3" as const, category: "museum" as const },
];

export const seedTouristSpots = async () => {
    // @ts-ignore
    if (!db || db._app?.options?.apiKey === "YOUR_API_KEY") {
        console.warn("Cannot seed database: No valid Firebase keys found.");
        alert("Cannot seed database: No valid Firebase keys found in firebaseConfig.ts");
        return;
    }

    console.log("Seeding started...");
    const dbRef = ref(db, "tourist_spots");

    for (const spot of RAW_SPOTS) {
        // Create a deterministic ID: "meenakshi_amman_temple"
        const spotId = spot.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const hash = geofire.geohashForLocation([spot.lat, spot.lng]);

        const newSpot: Omit<TouristSpot, 'id'> = {
            name: spot.name,
            category: spot.category,
            tier: spot.tier,
            importance_score: spot.tier === 'tier1' ? 9 : (spot.tier === 'tier2' ? 7 : 4),
            location: {
                lat: spot.lat,
                lng: spot.lng
            },
            geohash: hash,
            city: spot.city,
            state: "Tamil Nadu",
            verified: true,
            last_updated: new Date().toISOString()
        };

        try {
            // Use child(dbRef, spotId) to set a specific key (Upsert)
            const spotRef = child(dbRef, spotId);
            await set(spotRef, newSpot);
            console.log(`Upserted ${spotId}`);
        } catch (e) {
            console.error(`Error adding ${spot.name}:`, e);
        }
    }
    console.log("Seeding complete!");
};
