
import * as fs from 'fs';
import * as path from 'path';
import * as geofire from 'geofire-common';

const TARGET_FILE = '/home/dk/Documents/academics/projects/geo/india2.json';

// Verified coordinates for batch 2
const VERIFIED_COORDS: Record<string, { lat: number, lng: number }> = {
    "varanasi_ghats": { lat: 25.3167, lng: 83.0104 },
    "kashi_vishwanath": { lat: 25.3108, lng: 83.0106 },
    "kedarnath": { lat: 30.7346, lng: 79.0669 },
    "badrinath": { lat: 30.7433, lng: 79.4938 },
    "manali": { lat: 32.2396, lng: 77.1887 },
    "rohtang_pass": { lat: 32.3714, lng: 77.2464 },
    "dal_lake": { lat: 34.12, lng: 74.87 },
    "gulmarg": { lat: 34.05, lng: 74.38 },
    "konark_sun_temple": { lat: 19.8908, lng: 86.1003 },
    "jagannath_temple": { lat: 19.8049, lng: 85.8179 }, // User's value 19.8049 matches finding from search (close to Puri city center). One search result gave city generally. Let's stick to user (19.8049) if reasonable or update if specific temple precinct is different. Search result for Puri city ~19.89. Temple itself is at 19.80. User is correct.
    "sundarbans": { lat: 21.9497, lng: 88.9000 },
    "victoria_memorial": { lat: 22.5449, lng: 88.3425 },
    "statue_of_unity": { lat: 21.8380, lng: 73.7191 },
    "gir_forest": { lat: 21.1356, lng: 70.7967 },
    "elephanta_caves": { lat: 18.9633, lng: 72.9314 }
};

const BASE_DATA: any = {
    "varanasi_ghats": {
        "name": "Varanasi Ghats",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "verified": true,
        "location": { "lat": 25.3176, "lng": 83.0062 },
        "geohash": "",
        "nearby_spots": { "kashi_vishwanath": true }
    },

    "kashi_vishwanath": {
        "name": "Kashi Vishwanath Temple",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "verified": true,
        "location": { "lat": 25.3109, "lng": 83.0107 },
        "geohash": "",
        "nearby_spots": { "varanasi_ghats": true }
    },

    "kedarnath": {
        "name": "Kedarnath Temple",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Kedarnath",
        "state": "Uttarakhand",
        "verified": true,
        "location": { "lat": 30.7346, "lng": 79.0669 },
        "geohash": "",
        "nearby_spots": { "badrinath": true }
    },

    "badrinath": {
        "name": "Badrinath Temple",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Badrinath",
        "state": "Uttarakhand",
        "verified": true,
        "location": { "lat": 30.7433, "lng": 79.4938 },
        "geohash": "",
        "nearby_spots": { "kedarnath": true }
    },

    "manali": {
        "name": "Manali Hill Station",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Manali",
        "state": "Himachal Pradesh",
        "verified": true,
        "location": { "lat": 32.2396, "lng": 77.1887 },
        "geohash": "",
        "nearby_spots": { "rohtang_pass": true }
    },

    "rohtang_pass": {
        "name": "Rohtang Pass",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Manali",
        "state": "Himachal Pradesh",
        "verified": true,
        "location": { "lat": 32.3640, "lng": 77.2446 },
        "geohash": "",
        "nearby_spots": { "manali": true }
    },

    "dal_lake": {
        "name": "Dal Lake",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Srinagar",
        "state": "Jammu and Kashmir",
        "verified": true,
        "location": { "lat": 34.0837, "lng": 74.7973 },
        "geohash": "",
        "nearby_spots": { "gulmarg": true }
    },

    "gulmarg": {
        "name": "Gulmarg",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Gulmarg",
        "state": "Jammu and Kashmir",
        "verified": true,
        "location": { "lat": 34.0484, "lng": 74.3805 },
        "geohash": "",
        "nearby_spots": { "dal_lake": true }
    },

    "konark_sun_temple": {
        "name": "Konark Sun Temple",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Konark",
        "state": "Odisha",
        "verified": true,
        "location": { "lat": 19.8876, "lng": 86.0945 },
        "geohash": "",
        "nearby_spots": { "jagannath_temple": true }
    },

    "jagannath_temple": {
        "name": "Jagannath Temple",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Puri",
        "state": "Odisha",
        "verified": true,
        "location": { "lat": 19.8049, "lng": 85.8179 },
        "geohash": "",
        "nearby_spots": { "konark_sun_temple": true }
    },

    "sundarbans": {
        "name": "Sundarbans National Park",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "South 24 Parganas",
        "state": "West Bengal",
        "verified": true,
        "location": { "lat": 21.9497, "lng": 88.9000 },
        "geohash": "",
        "nearby_spots": { "victoria_memorial": true }
    },

    "victoria_memorial": {
        "name": "Victoria Memorial",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Kolkata",
        "state": "West Bengal",
        "verified": true,
        "location": { "lat": 22.5448, "lng": 88.3426 },
        "geohash": "",
        "nearby_spots": { "sundarbans": true }
    },

    "statue_of_unity": {
        "name": "Statue of Unity",
        "category": "monument",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Kevadia",
        "state": "Gujarat",
        "verified": true,
        "location": { "lat": 21.8380, "lng": 73.7191 },
        "geohash": "",
        "nearby_spots": { "gir_forest": true }
    },

    "gir_forest": {
        "name": "Gir National Park",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Junagadh",
        "state": "Gujarat",
        "verified": true,
        "location": { "lat": 21.1240, "lng": 70.8244 },
        "geohash": "",
        "nearby_spots": { "statue_of_unity": true }
    },

    "elephanta_caves": {
        "name": "Elephanta Caves",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Mumbai",
        "state": "Maharashtra",
        "verified": true,
        "location": { "lat": 18.9633, "lng": 72.9310 },
        "geohash": "",
        "nearby_spots": { "gateway_of_india": true }
    }
};

const main = () => {
    // 1. Update coordinates
    for (const key of Object.keys(BASE_DATA)) {
        if (VERIFIED_COORDS[key]) {
            BASE_DATA[key].location = VERIFIED_COORDS[key];
        }
    }

    // 2. Generate Geohashes
    for (const key of Object.keys(BASE_DATA)) {
        const { lat, lng } = BASE_DATA[key].location;
        BASE_DATA[key].geohash = geofire.geohashForLocation([lat, lng]);
    }

    // 3. Write to file
    fs.writeFileSync(TARGET_FILE, JSON.stringify(BASE_DATA, null, 2), 'utf-8');
    console.log(`Updated ${TARGET_FILE} with verified coordinates and new geohashes.`);
};

main();
