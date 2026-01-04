export type TouristCategory =
    | 'tourist_attraction'
    | 'museum'
    | 'historic'
    | 'landmark'
    | 'viewpoint'
    | 'park'
    | 'nature'
    | 'religious'
    | 'cafe'
    | 'cultural';

export type Tier = 'tier1' | 'tier2' | 'tier3';

export interface TouristSpot {
    id: string;
    name: string;
    category: TouristCategory;
    tier: Tier;
    importance_score: number; // 1-10
    location: {
        lat: number;
        lng: number;
    };
    geohash: string;
    city: string;
    state: "Tamil Nadu";
    verified: boolean;
    last_updated: string; // ISO date
}

export interface ExplorerRouteResult {
    routeId: string;
    explorerScore: number; // 0-10 normalized
    totalPOIsFound: number;
    tierBreakdown: {
        tier1: number;
        tier2: number;
        tier3: number;
    };
    explanation: string;
    pois: TouristSpot[]; // The actual spots found
}
