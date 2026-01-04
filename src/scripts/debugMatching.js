
// Plain JS Debug Script
// Run with: node src/scripts/debugMatching.js

const geofire = require('geofire-common');

console.log("--- DEBUG MATCHING (JS) ---");

// 1. Setup Data
const ROUTE_POINT = { lat: 9.9391, lng: 78.1217 }; // Madurai Route Sample
const DB_SPOT = { lat: 9.9195, lng: 78.1193, hash: "t9y3qu", name: "Meenakshi" };

// 2. Math Check
const dist = geofire.distanceBetween(
    [ROUTE_POINT.lat, ROUTE_POINT.lng],
    [DB_SPOT.lat, DB_SPOT.lng]
) * 1000;

console.log(`Distance: ${dist.toFixed(2)}m`);
const RADIUS = 7000;

if (dist <= RADIUS) {
    console.log(`✅ Distance OK (< ${RADIUS}m)`);
} else {
    console.log(`❌ Distance FAIL (> ${RADIUS}m)`);
}

// 3. Geohash Query Check
const center = [ROUTE_POINT.lat, ROUTE_POINT.lng];
const bounds = geofire.geohashQueryBounds(center, RADIUS);

console.log(`Geohash Bounds (${bounds.length}):`);
let covered = false;
for (const b of bounds) {
    // console.log(`  [${b[0]} - ${b[1]}]`);
    if (DB_SPOT.hash >= b[0] && DB_SPOT.hash <= b[1]) {
        covered = true;
        console.log(`✅ MATCH! Hash ${DB_SPOT.hash} is inside bound [${b[0]}, ${b[1]}]`);
    }
}

if (!covered) {
    console.log(`❌ geohashQueryBounds FAILED to cover the spot hash!`);
}
