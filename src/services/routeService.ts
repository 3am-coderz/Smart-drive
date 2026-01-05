import { Route, DrivingProfile } from '../types';
import { fetchLightingScore } from './osmService';
import { fetchRouteWeather } from './weatherService';

export const PROFILES: DrivingProfile[] = [
    {
        id: 'fast',
        name: 'Speed_Demon',
        description: 'Prioritizes shortest ETA above all else.',
        icon: 'Zap',
        weights: { eta: 10, activity: 0, lighting: 1 }
    },
    {
        id: 'safe',
        name: 'Safety_First',
        description: 'Prefers well-lit routes with populated areas.',
        icon: 'Shield',
        weights: { eta: 2, activity: 5, lighting: 10 }
    },
    {
        id: 'scenic',
        name: 'Explorer',
        description: 'Loves high activity and scenic routes.',
        icon: 'Compass',
        weights: { eta: 1, activity: 10, lighting: 5 }
    }
];

export const fetchRoutes = async (sourceCoords: { lat: number, lon: number }, destCoords: { lat: number, lon: number }, travelTime?: string, travelDate?: string): Promise<Route[]> => {
    if (!window.google || !window.google.maps) {
        throw new Error("Google Maps API not loaded");
    }

    const directionsService = new google.maps.DirectionsService();

    try {
        const response = await directionsService.route({
            origin: { lat: sourceCoords.lat, lng: sourceCoords.lon },
            destination: { lat: destCoords.lat, lng: destCoords.lon },
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        });

        if (!response.routes || response.routes.length === 0) {
            return [];
        }

        const processedRoutes = await Promise.all(response.routes.map(async (gRoute, index) => {
            const leg = gRoute.legs && gRoute.legs[0];
            const durationMins = leg?.duration?.value ? Math.round(leg.duration.value / 60) : 0;
            const distanceKm = leg?.distance?.value ? Number((leg.distance.value / 1000).toFixed(1)) : 0;

            let roadType: Route['roadType'];
            if (index === 0) {
                roadType = 'Highway';
            } else if (durationMins > (response.routes[0].legs?.[0]?.duration?.value || 0) / 60 * 1.2) {
                roadType = 'Scenic';
            } else {
                roadType = 'Backroads';
            }

            let activity = 5;
            if (roadType === 'Highway') activity = 4;
            if (roadType === 'Scenic') activity = 8;
            if (roadType === 'Backroads') activity = 6;

            let lightingScore = 5;
            let weatherData = undefined;

            if (gRoute.overview_path) {
                // Fetch basic lighting score
                lightingScore = await fetchLightingScore(gRoute.overview_path as any);

                // Fetch weather data
                try {
                    const pathForWeather = gRoute.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
                    weatherData = await fetchRouteWeather(
                        { lat: sourceCoords.lat, lng: sourceCoords.lon },
                        { lat: destCoords.lat, lng: destCoords.lon },
                        pathForWeather,
                        travelDate,
                        travelTime
                    );
                } catch (e) {
                    console.warn("Weather fetch failed", e);
                }
            }

            // STABLE ID: Based on source/destination names and route summary if available
            // This prevents UI refreshes from resetting the selection state unnecessarily
            const stableId = `route-${leg?.start_address.slice(0, 3)}-${leg?.end_address.slice(0, 3)}-${index}`;

            return {
                id: stableId,
                source: leg?.start_address || 'Start',
                destination: leg?.end_address || 'End',
                eta: durationMins,
                distance: distanceKm,
                activityScore: activity,
                lightingScore: lightingScore,
                weather: weatherData,
                roadType: roadType,
                description: gRoute.summary || leg?.start_address || 'Route',
                googleRoute: gRoute
            };
        }));

        return processedRoutes;

    } catch (error) {
        console.error("Direction/OSM Fetch failed", error);
        return [];
    }
};

// Lazy import to avoid circular dependency issues if any, or just standard import
import { findExplorerRoute } from './explorerService';

export const enhanceWithExplorerData = async (routes: Route[]): Promise<Route[]> => {
    try {
        console.log("Fetching Explorer data for routes...");
        const explorerResults = await findExplorerRoute(routes.map(r => ({
            id: r.id,
            overview_polyline: r.googleRoute?.overview_polyline,
            path: r.googleRoute?.overview_path?.map(p => ({ lat: p.lat(), lng: p.lng() }))
        })));

        // Merge results back
        return routes.map(route => {
            const result = explorerResults.find(res => res.routeId === route.id);
            if (result) {
                return {
                    ...route,
                    explorerScore: result.explorerScore,
                    explorerExplanation: result.explanation,
                    totalPOIs: result.totalPOIsFound
                };
            }
            return route;
        });
    } catch (error) {
        console.warn("Explorer Service failed (likely missing Firebase keys):", error);
        return routes;
    }
}


export const rankRoutes = (routes: Route[], profile: DrivingProfile, travelTime: string = "20:00"): Route[] => {
    const isDay = isDaytime(travelTime);

    // Adjust weights based on time of day
    const effectiveWeights = { ...profile.weights };
    if (isDay) {
        effectiveWeights.lighting = 0; // Ignore lighting during the day
    }

    return [...routes].sort((a, b) => {
        if (profile.id === 'fast') return a.eta - b.eta;

        if (profile.id === 'scenic') {
            // Primary: Tourist Spots Count
            // Secondary: High Distance (as requested by user)
            const poisA = a.totalPOIs || 0;
            const poisB = b.totalPOIs || 0;

            if (poisA !== poisB) {
                return poisB - poisA; // More spots = better
            }
            // Tie-breaker: Longer distance is better
            // console.log(`[Rank] Tie for POIs (${poisA}). Dist A: ${a.distance}, Dist B: ${b.distance}. Winner: ${b.distance > a.distance ? 'B' : 'A'}`);
            return b.distance - a.distance;
        }

        if (profile.id === 'safe') {
            // Purely calculated by lighting score
            if (a.lightingScore !== b.lightingScore) {
                return b.lightingScore - a.lightingScore; // Higher lighting = better
            }
            // Secondary tie-breaker: Activity score
            return b.activityScore - a.activityScore;
        }
        const scoreA = calculateScore(a, effectiveWeights);
        const scoreB = calculateScore(b, effectiveWeights);
        return scoreB - scoreA;
    });
};

const isDaytime = (time: string): boolean => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0], 10);
    return hour >= 6 && hour < 19; // 6 AM to 7 PM
};

const calculateScore = (route: Route, weights: { eta: number, activity: number, lighting: number }): number => {
    const etaScore = (200 - route.eta) * (weights.eta || 1);
    const activityScore = route.activityScore * 10 * (weights.activity || 1);
    // Lighting score logic is now controlled by the weights passed in
    const lightingScore = route.lightingScore * 10 * (weights.lighting || 1);
    return etaScore + activityScore + lightingScore;
};

export const getRecommendationReason = (route: Route, profile: DrivingProfile, travelTime: string = "20:00"): string => {
    if (profile.id === 'fast') return `Shortest route: ${route.eta} mins.`;

    if (profile.id === 'scenic') {
        const poiCount = route.totalPOIs || 0;
        if (poiCount > 0) {
            return `${poiCount} scenic spots found along this route.`;
        }
        return `Longest scenic drive: ${route.distance}km.`;
    }

    if (profile.id === 'safe') {
        return `High lighting score (${route.lightingScore}/10) for maximum safety.`;
    }
    return 'Balanced choice.';
};
