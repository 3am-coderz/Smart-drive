
import * as geofire from 'geofire-common';

const MADURAI_ROUTE_POINT = { lat: 9.9391, lng: 78.1217 }; // Near Meenakshi
const DB_SPOT_LOC = { lat: 9.9195, lng: 78.1193 }; // Meenakshi Temple from DB
const DB_HASH = "t9y3qu"; // From User Data

console.log("--- DEBUG GEOHASH ---");

const routeHash = geofire.geohashForLocation([MADURAI_ROUTE_POINT.lat, MADURAI_ROUTE_POINT.lng]);
console.log(`Route Point Hash: ${routeHash}`);
console.log(`DB Spot Hash:     ${DB_HASH}`);

const distance = geofire.distanceBetween(
    [MADURAI_ROUTE_POINT.lat, MADURAI_ROUTE_POINT.lng],
    [DB_SPOT_LOC.lat, DB_SPOT_LOC.lng]
) * 1000;
console.log(`Distance: ${distance.toFixed(2)} meters`);

const radius = 7000; // 7km
const center: geofire.Geopoint = [MADURAI_ROUTE_POINT.lat, MADURAI_ROUTE_POINT.lng];
const bounds = geofire.geohashQueryBounds(center, radius);

console.log(`Search Radius: ${radius}m`);
console.log(`Generated Bounds:`, bounds);

let isCovered = false;
for (const b of bounds) {
    if (DB_HASH >= b[0] && DB_HASH <= b[1]) {
        isCovered = true;
        console.log(`MATCH! ${DB_HASH} is between ${b[0]} and ${b[1]}`);
    }
}

if (!isCovered) {
    console.log("FAIL! DB Hash is NOT covered by query bounds.");
} else {
    console.log("SUCCESS! Logic covers the point.");
}
