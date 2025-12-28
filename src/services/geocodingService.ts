export interface LocationResult {
    lat: string;
    lon: string;
    display_name: string;
}

export const searchLocation = async (query: string): Promise<LocationResult | null> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("Geocoding failed", error);
        return null;
    }
};
