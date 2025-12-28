
import { DrivingProfile } from '../types';
import * as Icons from 'lucide-react';
import { clsx } from 'clsx';

interface ProfileSelectorProps {
    profiles: DrivingProfile[];
    selectedProfileId: string;
    onSelect: (id: string) => void;
}

export function ProfileSelector({ profiles, selectedProfileId, onSelect }: ProfileSelectorProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Select Driving Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {profiles.map((profile) => {
                    // Dynamic Icon Rendering
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const Icon = (Icons as any)[profile.icon] || Icons.Car;
                    const isSelected = selectedProfileId === profile.id;

                    return (
                        <button
                            key={profile.id}
                            onClick={() => onSelect(profile.id)}
                            className={clsx(
                                "flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98]",
                                isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 ring-offset-1"
                                    : "border-gray-100 bg-white hover:border-blue-200 text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <div className={clsx(
                                "p-3 rounded-full mb-3",
                                isSelected ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500"
                            )}>
                                <Icon size={24} />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-sm mb-1">{profile.name.replace('_', ' ')}</span>
                                <span className="text-xs opacity-80 line-clamp-2">{profile.description}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
