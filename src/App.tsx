import { useState, useMemo } from 'react';
import { InputSection } from './components/InputSection';
import { ProfileSelector } from './components/ProfileSelector';
import { RouteList } from './components/RouteList';
import { MapComponent } from './components/MapComponent';
import { PROFILES, rankRoutes, fetchRoutes } from './services/routeService';
import { searchLocation } from './services/geocodingService';
import { Route } from './types';
import { Navigation } from 'lucide-react';

function App() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>(PROFILES[0].id);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const selectedProfile = useMemo(() =>
        PROFILES.find(p => p.id === selectedProfileId) || PROFILES[0],
        [selectedProfileId]
    );

    const handleSearch = async (source: string, destination: string) => {
        setIsLoading(true);
        setHasSearched(true);
        setRoutes([]); // Clear previous results

        try {
            // 1. Geocode Source
            const sourceLoc = await searchLocation(source);
            if (!sourceLoc) throw new Error(`Could not find location: ${source}`);

            // 2. Geocode Destination
            const destLoc = await searchLocation(destination);
            if (!destLoc) throw new Error(`Could not find location: ${destination}`);

            // 3. Fetch OSRM Routes
            const fetchedRoutes = await fetchRoutes(
                { lat: sourceLoc.lat, lon: sourceLoc.lon },
                { lat: destLoc.lat, lon: destLoc.lon }
            );

            // Update route descriptions with actual address
            const routesWithNames = fetchedRoutes.map(r => ({
                ...r,
                source: sourceLoc.display_name.split(',')[0],
                destination: destLoc.display_name.split(',')[0]
            }));

            setRoutes(routesWithNames);

        } catch (error) {
            console.error("Failed to fetch routes", error);
            alert("Failed to find routes. Please try specific city names.");
        } finally {
            setIsLoading(false);
        }
    };

    // Re-rank whenever routes or profile changes
    const rankedRoutes = useMemo(() => {
        return rankRoutes(routes, selectedProfile);
    }, [routes, selectedProfile]);

    const topRouteId = rankedRoutes.length > 0 ? rankedRoutes[0].id : undefined;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto space-y-6"> {/* Increased width for map */}

                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-2">
                        <Navigation className="text-white" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Smart Route Recommender
                    </h1>
                    <p className="text-gray-500">Find the perfect path for your drive.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        {/* Input Section */}
                        <InputSection onSearch={handleSearch} isLoading={isLoading} />

                        {/* Profile Selector */}
                        <ProfileSelector
                            profiles={PROFILES}
                            selectedProfileId={selectedProfileId}
                            onSelect={setSelectedProfileId}
                        />

                        {/* Results List */}
                        {hasSearched && rankedRoutes.length > 0 && (
                            <RouteList routes={rankedRoutes} selectedProfile={selectedProfile} />
                        )}
                        {hasSearched && !isLoading && rankedRoutes.length === 0 && (
                            <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                No routes found.
                                <br /><span className="text-sm">Try major cities (e.g., "New York", "Boston")</span>
                            </div>
                        )}
                    </div>

                    {/* Map Section - Main Display */}
                    <div className={`transition-all duration-500 ${hasSearched ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
                        <div className="sticky top-6">
                            <MapComponent
                                routes={rankedRoutes}
                                selectedRouteId={topRouteId}
                            />
                            <p className="text-xs text-center text-gray-400 mt-2">
                                Map data © OpenStreetMap contributors, Routing via OSRM
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;
