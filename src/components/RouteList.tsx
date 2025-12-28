
import { Route, DrivingProfile } from '../types';
import { getRecommendationReason } from '../services/routeService';
import { Timer, Zap, Lightbulb, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface RouteListProps {
    routes: Route[];
    selectedProfile: DrivingProfile;
}

export function RouteList({ routes, selectedProfile }: RouteListProps) {
    if (routes.length === 0) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                Recommended Routes
            </h3>

            <div className="space-y-4">
                {routes.map((route, index) => {
                    const isTopPick = index === 0;
                    const reason = getRecommendationReason(route, selectedProfile);

                    return (
                        <div
                            key={route.id}
                            className={clsx(
                                "relative p-5 rounded-xl border-2 transition-all duration-300",
                                isTopPick
                                    ? "border-green-500 bg-green-50/50 shadow-md transform scale-[1.01]"
                                    : "border-gray-100 bg-white hover:border-gray-200"
                            )}
                        >
                            {isTopPick && (
                                <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    BEST MATCH
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{route.roadType} Route</h4>
                                    <p className="text-gray-500 text-sm">{route.description}</p>
                                </div>
                                <div className="text-2xl font-bold text-blue-900">
                                    {route.eta} <span className="text-sm font-normal text-gray-500">min</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                                        <Timer size={14} />
                                        <span className="text-xs uppercase font-bold">ETA</span>
                                    </div>
                                    <span className={clsx("font-semibold", route.eta < 50 ? "text-green-600" : "text-gray-700")}>
                                        {route.eta}m
                                    </span>
                                </div>

                                <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                                        <span className="text-xs uppercase font-bold">Dist</span>
                                    </div>
                                    <span className="font-semibold text-gray-700">
                                        {route.distance}km
                                    </span>
                                </div>

                                <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                                        <Zap size={14} />
                                        <span className="text-xs uppercase font-bold">Activity</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={clsx(
                                                "w-1 h-3 rounded-full",
                                                i < Math.floor(route.activityScore / 2) ? "bg-blue-500" : "bg-gray-200"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                                        <Lightbulb size={14} />
                                        <span className="text-xs uppercase font-bold">Lighting</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={clsx(
                                                "w-1 h-3 rounded-full",
                                                i < Math.floor(route.lightingScore / 2) ? "bg-yellow-400" : "bg-gray-200"
                                            )} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation Reason */}
                            <div className="bg-white/80 rounded-lg p-3 border border-gray-100">
                                <p className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                                    <span>
                                        <span className="font-semibold text-gray-900">Why this route?</span>{' '}
                                        {reason}
                                    </span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
