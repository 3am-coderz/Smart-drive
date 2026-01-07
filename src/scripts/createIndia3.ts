
import * as fs from 'fs';
import * as path from 'path';
import * as geofire from 'geofire-common';

const TARGET_FILE = '/home/dk/Documents/academics/projects/geo/india3.json';

// Verified coordinates for batch 3
const VERIFIED_COORDS: Record<string, { lat: number, lng: number }> = {
    "rann_of_kutch": { lat: 24.0454, lng: 70.1456 },
    "dwarka_temple": { lat: 22.2379, lng: 68.9676 },
    "ajanta_caves": { lat: 20.5524, lng: 75.7004 },
    "ellora_caves": { lat: 20.0225, lng: 75.1742 },
    "mahabodhi_temple": { lat: 24.6960, lng: 84.9914 },
    "nalanda_ruins": { lat: 25.1357, lng: 85.4432 },
    "kaziranga": { lat: 26.5775, lng: 93.1711 }, // Verified: 26.5775 is within 26°30'-26°45'. User value was likely fine, search confirmed general area.
    "majuli_island": { lat: 27.0016, lng: 94.2243 }, // Verified 27.00.
    "meghalaya_living_root_bridge": { lat: 25.2716, lng: 91.7311 }, // Search for 'Living Root Bridges' specifically could vary as there are many. Cherrapunji is 25.27. User Lat 25.27 is accurate for general area.
    "dawki_river": { lat: 25.2011, lng: 92.0226 }, // Search Dawki: 25.20. User accurate.
    "andaman_radhanagar": { lat: 11.9845, lng: 92.9876 }, // Search: 11°58′55″N = 11.9819. User 11.9845 is very close.
    "cellular_jail": { lat: 11.6750, lng: 92.7480 } // Search: 11.6750. User 11.667. Update to 11.6750 for precision.
};

const BASE_DATA: any = {
    "rann_of_kutch": {
        "name": "Rann of Kutch",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Kutch",
        "state": "Gujarat",
        "verified": true,
        "location": { "lat": 23.7337, "lng": 69.8597 },
        "geohash": "",
        "nearby_spots": { "dwarka_temple": true }
    },
    "dwarka_temple": {
        "name": "Dwarkadhish Temple",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Dwarka",
        "state": "Gujarat",
        "verified": true,
        "location": { "lat": 22.2456, "lng": 68.9685 },
        "geohash": "",
        "nearby_spots": { "rann_of_kutch": true }
    },
    "ajanta_caves": {
        "name": "Ajanta Caves",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Aurangabad",
        "state": "Maharashtra",
        "verified": true,
        "location": { "lat": 20.5519, "lng": 75.7033 },
        "geohash": "",
        "nearby_spots": { "ellora_caves": true }
    },
    "ellora_caves": {
        "name": "Ellora Caves",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Aurangabad",
        "state": "Maharashtra",
        "verified": true,
        "location": { "lat": 20.0268, "lng": 75.1796 },
        "geohash": "",
        "nearby_spots": { "ajanta_caves": true }
    },
    "mahabodhi_temple": {
        "name": "Mahabodhi Temple",
        "category": "religious",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Bodh Gaya",
        "state": "Bihar",
        "verified": true,
        "location": { "lat": 24.6950, "lng": 84.9912 },
        "geohash": "",
        "nearby_spots": { "nalanda_ruins": true }
    },
    "nalanda_ruins": {
        "name": "Nalanda University Ruins",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Nalanda",
        "state": "Bihar",
        "verified": true,
        "location": { "lat": 25.1357, "lng": 85.4430 },
        "geohash": "",
        "nearby_spots": { "mahabodhi_temple": true }
    },
    "kaziranga": {
        "name": "Kaziranga National Park",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Golaghat",
        "state": "Assam",
        "verified": true,
        "location": { "lat": 26.5775, "lng": 93.1711 },
        "geohash": "",
        "nearby_spots": { "majuli_island": true }
    },
    "majuli_island": {
        "name": "Majuli Island",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Majuli",
        "state": "Assam",
        "verified": true,
        "location": { "lat": 27.0016, "lng": 94.2243 },
        "geohash": "",
        "nearby_spots": { "kaziranga": true }
    },
    "meghalaya_living_root_bridge": {
        "name": "Living Root Bridges",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Cherrapunji",
        "state": "Meghalaya",
        "verified": true,
        "location": { "lat": 25.2716, "lng": 91.7311 },
        "geohash": "",
        "nearby_spots": { "dawki_river": true }
    },
    "dawki_river": {
        "name": "Dawki River",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Dawki",
        "state": "Meghalaya",
        "verified": true,
        "location": { "lat": 25.2011, "lng": 92.0226 },
        "geohash": "",
        "nearby_spots": { "meghalaya_living_root_bridge": true }
    },
    "andaman_radhanagar": {
        "name": "Radhanagar Beach",
        "category": "park",
        "tier": "tier1",
        "importance_score": 9,
        "city": "Havelock Island",
        "state": "Andaman and Nicobar Islands",
        "verified": true,
        "location": { "lat": 11.9845, "lng": 92.9876 },
        "geohash": "",
        "nearby_spots": { "cellular_jail": true }
    },
    "cellular_jail": {
        "name": "Cellular Jail",
        "category": "historic",
        "tier": "tier1",
        "importance_score": 10,
        "city": "Port Blair",
        "state": "Andaman and Nicobar Islands",
        "verified": true,
        "location": { "lat": 11.6670, "lng": 92.7469 },
        "geohash": "",
        "nearby_spots": { "andaman_radhanagar": true }
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
