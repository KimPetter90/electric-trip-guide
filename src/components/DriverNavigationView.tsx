import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Navigation } from 'lucide-react';

interface DriverNavigationViewProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  };
  routeData?: {
    from: string;
    to: string;
    via?: string;
  };
  isActive: boolean;
  onExit: () => void;
  nextTurn?: {
    direction: 'left' | 'right' | 'straight' | 'u-turn';
    distance: number;
    instruction: string;
    streetName?: string;
  };
  remainingDistance: number;
  remainingTime: number;
  estimatedArrival: string;
  currentSpeed: number;
}

export const DriverNavigationView: React.FC<DriverNavigationViewProps> = ({
  isActive,
  onExit,
  nextTurn,
  remainingDistance,
  remainingTime,
  estimatedArrival,
  currentSpeed,
  routeData
}) => {
  if (!isActive) return null;

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}t ${mins}min`;
    }
    return `${mins}min`;
  };

  const getDirectionArrow = (direction: string) => {
    switch (direction) {
      case 'left':
        return '↰';
      case 'right':
        return '↱';
      case 'u-turn':
        return '↺';
      default:
        return '↑';
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-gray-900 text-white flex flex-col">
      {/* Top instruction area - Google Maps style */}
      <div className="flex-1 flex flex-col">
        {/* Exit button in top-right corner */}
        <div className="absolute top-4 right-4 z-10">
          <Button 
            onClick={onExit}
            variant="ghost" 
            size="sm"
            className="bg-black/30 text-white hover:bg-black/50 rounded-full w-10 h-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main navigation instruction */}
        {nextTurn && (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="flex items-center gap-8 max-w-4xl w-full">
              {/* Large direction arrow */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-6xl text-white">
                    {getDirectionArrow(nextTurn.direction)}
                  </span>
                </div>
              </div>
              
              {/* Turn instruction and distance */}
              <div className="flex-1">
                <div className="text-5xl font-bold mb-2">
                  {formatDistance(nextTurn.distance / 1000)}
                </div>
                <div className="text-2xl text-gray-300 mb-1">
                  {nextTurn.instruction}
                </div>
                {nextTurn.streetName && (
                  <div className="text-xl text-gray-400">
                    på {nextTurn.streetName}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Destination info */}
        {routeData?.to && (
          <div className="px-8 py-4 text-center">
            <div className="text-lg text-gray-400">Kjører til</div>
            <div className="text-xl font-medium text-white">{routeData.to}</div>
          </div>
        )}
      </div>

      {/* Bottom info bar - Google Maps style */}
      <div className="bg-black/80 p-6">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatDistance(remainingDistance)}</div>
            <div className="text-sm text-gray-400">gjenstår</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatTime(remainingTime)}</div>
            <div className="text-sm text-gray-400">ETA {estimatedArrival}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{Math.round(currentSpeed)} km/t</div>
            <div className="text-sm text-gray-400">hastighet</div>
          </div>
        </div>
      </div>
    </div>
  );
};