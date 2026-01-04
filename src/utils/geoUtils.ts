import * as geofire from 'geofire-common';

export interface LatLng {
    lat: number;
    lng: number;
}

/**
 * Calculates distance between two points in meters using Haversine formula
 */
export const calculateDistance = (p1: LatLng, p2: LatLng): number => {
    return geofire.distanceBetween([p1.lat, p1.lng], [p2.lat, p2.lng]) * 1000;
};

/**
 * Decodes Google Maps encoded polyline string into an array of LatLng
 */
export const decodePolyline = (encoded: string): LatLng[] => {
    const poly: LatLng[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
};

/**
 * Samples points along a path at a specified interval (in meters)
 * This is crucial to avoid querying every single point on a route
 */
export const sampleRoutePoints = (route: LatLng[], intervalMeters: number): LatLng[] => {
    if (route.length === 0) return [];

    const sampled: LatLng[] = [route[0]];
    let accumulatedDist = 0;

    for (let i = 0; i < route.length - 1; i++) {
        const p1 = route[i];
        const p2 = route[i + 1];
        const dist = calculateDistance(p1, p2);

        if (accumulatedDist + dist >= intervalMeters) {
            // Calculate how much distance we need to cover on this segment
            let remainingDist = intervalMeters - accumulatedDist;
            let currentSegDist = dist;
            let pStart = p1;

            // While we can still fit intervals in this segment
            while (remainingDist <= currentSegDist) {
                const ratio = remainingDist / currentSegDist;
                const newLat = pStart.lat + (p2.lat - pStart.lat) * ratio;
                const newLng = pStart.lng + (p2.lng - pStart.lng) * ratio;
                const newPoint = { lat: newLat, lng: newLng };

                sampled.push(newPoint);

                // Reset for next interval
                currentSegDist -= remainingDist;
                pStart = newPoint;
                accumulatedDist = 0; // We just placed a point
                remainingDist = intervalMeters;
            }
            accumulatedDist = distanceBetween(pStart, p2); // Remainder
        } else {
            accumulatedDist += dist;
        }
    }

    // Always include the end point
    sampled.push(route[route.length - 1]);

    return sampled;
};

// Helper for local interpolation math avoiding circular dependency
function distanceBetween(p1: LatLng, p2: LatLng): number {
    return geofire.distanceBetween([p1.lat, p1.lng], [p2.lat, p2.lng]) * 1000;
}

/**
 * Generates a set of geohash queries to cover the entire route corridor within a certain radius.
 * Returns unique GeohashBounds to minimize DB reads.
 */
export const getRouteQueryBounds = (sampledPoints: LatLng[], radiusMeters: number) => {
    // We treat each point as a center for a query
    // To optimize, we can check if points share the same geohash precision area
    // But geofire-common handles the bounding box logic well.

    // geofire.geohashQueryBounds returns string[][], representing [start, end] tuples
    const queries: string[][] = [];

    // We will collect all geohashes needed
    // Ideally we merge overlapping ones, but for now we iterate points
    // To optimization: skip points that are very close (already handled by sampling)

    for (const point of sampledPoints) {
        const center: geofire.Geopoint = [point.lat, point.lng];
        const bounds = geofire.geohashQueryBounds(center, radiusMeters);
        queries.push(...bounds);
    }

    // Deduplicate queries based on start/end hash to avoid redundant reads
    const uniqueQueries = new Map<string, string[]>();
    for (const q of queries) {
        const key = `${q[0]}-${q[1]}`;
        uniqueQueries.set(key, q);
    }

    return Array.from(uniqueQueries.values());
};
