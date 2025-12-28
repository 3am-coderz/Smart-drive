export type RoadType = 'Highway' | 'City' | 'Scenic' | 'Backroads';

export interface Route {
    id: string;
    source: string;
    destination: string;
    eta: number; // in minutes
    distance: number; // in km
    activityScore: number; // 0-10 (Places density)
    lightingScore: number; // 0-10
    roadType: RoadType;
    description: string;
    geometry?: string; // Encoded polyline from OSRM
}

export type ProfileId = 'fast' | 'safe' | 'scenic' | 'balanced';

export interface DrivingProfile {
    id: ProfileId;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    weights: {
        eta: number;
        activity: number;
        lighting: number;
    };
}
