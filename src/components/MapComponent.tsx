import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Route } from '../types';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import { useEffect } from 'react';

// Fix for default marker icon in React-Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
    routes: Route[];
    selectedRouteId?: string;
}

function FitBounds({ routes, selectedRouteId }: { routes: Route[], selectedRouteId?: string }) {
    const map = useMap();

    useEffect(() => {
        if (routes.length === 0) return;

        const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
        if (selectedRoute && selectedRoute.geometry) {
            try {
                const decoded = polyline.decode(selectedRoute.geometry);
                // polyline.decode returns [lat, lon], which is what Leaflet needs
                map.fitBounds(decoded as [number, number][], { padding: [50, 50] });
            } catch (e) {
                console.error("Failed to decode geometry", e);
            }
        }
    }, [routes, selectedRouteId, map]);

    return null;
}

export function MapComponent({ routes, selectedRouteId }: MapComponentProps) {
    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border-2 border-white z-0 relative">
            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {routes.map((route) => {
                    if (!route.geometry) return null;
                    const isSelected = route.id === selectedRouteId;
                    const decoded = polyline.decode(route.geometry);

                    return (
                        <Polyline
                            key={route.id}
                            positions={decoded as [number, number][]}
                            pathOptions={{
                                color: isSelected ? '#2563eb' : '#94a3b8',
                                weight: isSelected ? 6 : 4,
                                opacity: isSelected ? 1 : 0.6
                            }}
                        />
                    );
                })}

                <FitBounds routes={routes} selectedRouteId={selectedRouteId} />
            </MapContainer>
        </div>
    );
}
