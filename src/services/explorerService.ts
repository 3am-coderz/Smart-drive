import { ref, query, orderByChild, startAt, endAt, get } from 'firebase/database';
import { db } from './firebaseConfig';
import { TouristSpot, ExplorerRouteResult } from '../types/firestore';
import { decodePolyline, sampleRoutePoints, calculateDistance, getRouteQueryBounds, LatLng } from '../utils/geoUtils';
import * as geofire from 'geofire-common';

// Constants for Scoring
// Constants for Scoring
const POI_SEARCH_RADIUS = 20000; // Look for POIs within 20km of the route
const SAMPLING_INTERVAL = 10000; // Sample route every 10km to avoid excessive overlap

const TIER_WEIGHTS = {
    tier1: 10,
    tier2: 7,
    tier3: 4
};

const DISTANCE_PENALTIES = [
    { maxDist: 200, factor: 1.0 },
    { maxDist: 500, factor: 0.7 },
    { maxDist: 800, factor: 0.4 },
    { maxDist: Infinity, factor: 0.0 }
];

/**
 * Main function to evaluate a list of routes and return the Explorer Route analysis
 */
const MOCK_POIS: TouristSpot[] = [
    { id: 'm1', name: "Meenakshi Temple", category: 'religious', tier: 'tier1', importance_score: 10, location: { lat: 9.919, lng: 78.119 }, geohash: '', city: 'Madurai', state: 'Tamil Nadu', verified: true, last_updated: '' },
    { id: 'm2', name: "Thirumalai Nayak Palace", category: 'historic', tier: 'tier2', importance_score: 8, location: { lat: 9.915, lng: 78.12 }, geohash: '', city: 'Madurai', state: 'Tamil Nadu', verified: true, last_updated: '' },
    { id: 'm3', name: "Chettinad Mansions", category: 'cultural', tier: 'tier2', importance_score: 7, location: { lat: 10.07, lng: 78.78 }, geohash: '', city: 'Karaikudi', state: 'Tamil Nadu', verified: true, last_updated: '' }
];

export const findExplorerRoute = async (routes: any[]): Promise<ExplorerRouteResult[]> => {

    // Check for missing/placeholder keys
    // @ts-ignore
    const isMockMode = !db || db._app?.options?.apiKey === "YOUR_API_KEY";

    if (isMockMode) {
        console.warn("Using MOCK Explorer data (No Firebase Keys detected).");
        return routes.map((r, i) => ({
            routeId: r.id || 'unknown',
            explorerScore: i === 1 ? 9.2 : (8.5 - i), // Fake differentiation
            totalPOIsFound: i === 1 ? 12 : 5,
            tierBreakdown: { tier1: 2, tier2: 5, tier3: i === 1 ? 5 : 2 },
            explanation: i === 1 ? "Passing 2 major temples and 5 historic spots." : "Scenic route with few stops.",
            pois: MOCK_POIS
        }));
    }

    const results: ExplorerRouteResult[] = [];

    for (const route of routes) {
        // Handle both pre-decoded arrays or encoded strings depending on your route object
        // Assuming route.overview_polyline or route.path is available
        // For Google Directions object it is route.overview_polyline

        let path: LatLng[] = [];
        if (typeof route.overview_polyline === 'string') {
            path = decodePolyline(route.overview_polyline);
        } else if (route.overview_polyline && route.overview_polyline.points) { // Google Maps object
            path = decodePolyline(route.overview_polyline.points);
        } else if (Array.isArray(route.path)) { // Custom object
            path = route.path;
        }

        if (path.length === 0) continue;

        const scoreResult = await scoreRoute(route.id || 'unknown', path, route.legs?.[0]?.distance?.value || 0);
        results.push(scoreResult);
    }

    // Sort by score descending
    return results.sort((a, b) => b.explorerScore - a.explorerScore);
};

/**
 * Scores a single route
 */
const scoreRoute = async (routeId: string, path: LatLng[], routeLengthMeters: number): Promise<ExplorerRouteResult> => {
    // 1. Sample the route
    const samples = sampleRoutePoints(path, SAMPLING_INTERVAL);

    // 2. Fetch POIs along the route (Deduplicated)
    const uniquePOIs = await fetchPOIsAlongPath(samples);

    // 3. Score the route
    let totalScore = 0;
    const tierCounts = { tier1: 0, tier2: 0, tier3: 0 };
    const validPOIs: TouristSpot[] = [];

    for (const poi of uniquePOIs) {
        // Calculate shortest distance from POI to *any* sampled point 
        // (A more accurate approach would be nearest point on polyline, but samples are close enough for estimation)
        let minDistance = Infinity;
        for (const sample of samples) {
            const d = calculateDistance(poi.location, sample);
            if (d < minDistance) minDistance = d;
        }

        // Apply distance penalty
        let penaltyFactor = 0;
        for (const penalty of DISTANCE_PENALTIES) {
            if (minDistance <= penalty.maxDist) {
                penaltyFactor = penalty.factor;
                break;
            }
        }

        if (penaltyFactor > 0) {
            const weight = TIER_WEIGHTS[poi.tier] || 0;
            totalScore += weight * penaltyFactor;

            tierCounts[poi.tier]++;
            validPOIs.push(poi);
        }
    }

    // 4. Normalize
    // Score per 100km to make it comparable between short/long routes
    const lengthKm = routeLengthMeters / 1000;
    const normalizedScore = lengthKm > 0 ? (totalScore / lengthKm) * 10 : 0;

    // Clamp to 0-10 or let it float (user asked for 0-10, but raw score might be high)
    // Let's perform a sigmoid-like clamping or just cap it for now.
    // For now, let's return raw weighted score scaled down, e.g. /10
    const finalScore = Math.min(10, Math.round(normalizedScore) / 10);

    const explanation = generateExplanation(tierCounts, validPOIs.length);

    return {
        routeId,
        explorerScore: finalScore,
        totalPOIsFound: validPOIs.length,
        tierBreakdown: tierCounts,
        explanation,
        pois: validPOIs
    };
};

/**
 * Fetches relevant POIs from Realtime Database using GeoHashes
 */
const fetchPOIsAlongPath = async (samples: LatLng[]): Promise<TouristSpot[]> => {
    if (samples.length === 0) return [];

    const bounds = getRouteQueryBounds(samples, POI_SEARCH_RADIUS);
    console.log(`[Explorer] Searching ${bounds.length} geohash bounds for ${samples.length} samples.`);

    const promises = [];

    const dbRef = ref(db, 'tourist_spots');

    for (const b of bounds) {
        // console.log(`[Explorer] Query bound: ${b[0]} - ${b[1]}`);
        const q = query(
            dbRef,
            orderByChild('geohash'),
            startAt(b[0]),
            endAt(b[1])
        );
        promises.push(get(q));
    }

    // Collect all snapshots
    let snapshots;
    try {
        snapshots = await Promise.all(promises);
    } catch (error) {
        console.error("[Explorer] Failed to query RTDB:", error);
        return [];
    }

    const foundSpots: TouristSpot[] = [];
    const processedIds = new Set<string>();

    for (const snap of snapshots) {
        if (!snap.exists()) continue;

        const val = snap.val();
        // RTDB returns an object where keys are IDs (unless it's an array, but standard is object)
        Object.keys(val).forEach(key => {
            if (processedIds.has(key)) return;

            const data = val[key] as TouristSpot;
            // RTDB doesn't automatically include the ID in the data like Firestore doc.data()
            // We ensure ID is preserved

            const lat = data.location?.lat;
            const lng = data.location?.lng;

            if (lat === undefined || lng === undefined) return; // Skip malformed data

            // In-memory distance filter (false positives from geohash)
            let isWithinRange = false;
            let minDistance = Infinity;
            let closestSampleHash = "";

            for (const sample of samples) {
                const dist = geofire.distanceBetween([lat, lng], [sample.lat, sample.lng]) * 1000;
                if (dist < minDistance) {
                    minDistance = dist;
                    closestSampleHash = geofire.geohashForLocation([sample.lat, sample.lng]);
                }

                if (dist <= POI_SEARCH_RADIUS) {
                    isWithinRange = true;
                    // Keep searching to find absolute min distance for logging
                }
            }

            // LOGGING REQUESTED BY USER: Compare Sample Hash vs DB Hash
            // Only log if it's somewhat close (e.g. within 50km) to avoid spamming 1000s of unrelated spots if the DB is huge
            if (minDistance < 50000) {
                console.log(`[Verifier] Spot: ${data.name} (${data.geohash}) | Closest Sample Hash: ${closestSampleHash} | Dist: ${minDistance.toFixed(0)}m | Covered? ${isWithinRange}`);
            }

            if (isWithinRange) {
                processedIds.add(key);
                foundSpots.push({ ...data, id: key });
            }
        });
    }

    console.log(`[Explorer] Found raw spots, filtered to ${foundSpots.length} unique spots nearby.`);
    return foundSpots;
};

const generateExplanation = (breakdown: any, total: number): string => {
    if (total === 0) return "No scenic spots found on this route.";

    const parts = [];
    if (breakdown.tier1 > 0) parts.push(`${breakdown.tier1} major attractions`);
    if (breakdown.tier2 > 0) parts.push(`${breakdown.tier2} nature/parks`);
    if (breakdown.tier3 > 0) parts.push(`${breakdown.tier3} cultural spots`);

    return parts.join(', ') + " along the way.";
};
