import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface InputSectionProps {
    onSearch: (source: string, destination: string) => void;
    isLoading: boolean;
}

export function InputSection({ onSearch, isLoading }: InputSectionProps) {
    const [source, setSource] = useState('Home');
    const [destination, setDestination] = useState('Work');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (source && destination) {
            onSearch(source, destination);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                        <MapPin size={20} />
                    </div>
                    <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Starting Point"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                        <Navigation size={20} />
                    </div>
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Destination"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                ) : (
                    'Find Routes'
                )}
            </button>
        </form>
    );
}
