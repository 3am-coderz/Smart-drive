import { Route, DrivingProfile } from '../types';

interface OSRMResponse {
    routes: Array<{
        duration: number; // seconds
        distance: number; // meters
        geometry: string; // polyline
        legs: Array<{
            steps: Array<{
                name: string;
                duration: number;
                distance: number;
                // OSRM provides more, but this is enough for heuristics
            }>
        }>
    }>;
}

// OSRM public demo server (respect usage limits!)
const OSRM_API_BASE = 'https://router.project-osrm.org/route/v1/driving';

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

export const fetchRoutes = async (sourceCoords: { lat: string, lon: string }, destCoords: { lat: string, lon: string }): Promise<Route[]> => {
    try {
        // Request multiple alternatives
        const url = `${OSRM_API_BASE}/${sourceCoords.lon},${sourceCoords.lat};${destCoords.lon},${destCoords.lat}?overview=full&alternatives=3&steps=true`;

        const response = await fetch(url);
        const data: OSRMResponse = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return [];
        }

        // Map OSRM routes to our Route interface with heuristics
        return data.routes.map((osrmRoute, index) => {
            // Heuristics based on available data
            const durationMins = Math.round(osrmRoute.duration / 60);
            const distanceKm = Number((osrmRoute.distance / 1000).toFixed(1));

            // Randomize "road type" and scores slightly based on index (simulating different paths)
            // In a real app we'd analyze osrmRoute.legs[0].steps for highway tags.
            let roadType: Route['roadType'] = 'City';
            let activity = 5;
            let lighting = 5;

            // Apply some "fake" characteristics based on duration/distance differences
            // Longer routes = usually scenic or backroads
            // Shorter routes = highway/city

            const isLongest = index === data.routes.length - 1;
            const isShortest = index === 0;

            if (isShortest) {
                roadType = 'Highway';
                activity = 3;
                lighting = 8;
            } else if (isLongest) {
                roadType = 'Scenic';
                activity = 7;
                lighting = 4;
            } else {
                roadType = 'Backroads';
                activity = 5;
                lighting = 5;
            }

            return {
                id: `route-${index}`,
                source: 'Start', // Updated by App UI usually
                destination: 'End',
                eta: durationMins,
                distance: distanceKm,
                activityScore: activity,
                lightingScore: lighting,
                roadType,
                description: `Via ${osrmRoute.legs[0]?.steps[0]?.name || 'unnamed road'}`,
                geometry: osrmRoute.geometry
            };
        });

    } catch (error) {
        console.error("OSRM Fetch failed", error);
        return [];
    }
};

export const rankRoutes = (routes: Route[], profile: DrivingProfile): Route[] => {
    return [...routes].sort((a, b) => {
        const scoreA = calculateScore(a, profile);
        const scoreB = calculateScore(b, profile);
        return scoreB - scoreA;
    });
};

const calculateScore = (route: Route, profile: DrivingProfile): number => {
    const etaScore = (120 - route.eta) * profile.weights.eta;
    const activityScore = route.activityScore * 10 * profile.weights.activity;
    const lightingScore = route.lightingScore * 10 * profile.weights.lighting;

    return etaScore + activityScore + lightingScore;
};

export const getRecommendationReason = (route: Route, profile: DrivingProfile): string => {
    if (profile.id === 'fast') return `Fastest option: ${route.eta} mins.`;
    if (profile.id === 'safe') return `Best lighting (${route.lightingScore}/10) and activity.`;
    if (profile.id === 'scenic') return `High activity score (${route.activityScore}/10) for exploration.`;
    return 'Balanced choice.';
};
