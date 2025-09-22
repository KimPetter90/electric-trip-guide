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
    <div className="fixed inset-0 z-[999] bg-background flex flex-col">
      {/* Header med exit button */}
      <div className="flex justify-between items-center p-4 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          <span className="font-medium">Navigasjon</span>
        </div>
        <Button 
          onClick={onExit}
          variant="ghost" 
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Hovedinnhold */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
        
        {/* Neste sving - stor og tydelig */}
        {nextTurn && (
          <div className="mb-8">
            <div className="text-8xl mb-4 text-primary">
              {getDirectionArrow(nextTurn.direction)}
            </div>
            <div className="text-4xl font-bold mb-2">
              {formatDistance(nextTurn.distance / 1000)}
            </div>
            <div className="text-xl text-muted-foreground mb-1">
              {nextTurn.instruction}
            </div>
            {nextTurn.streetName && (
              <div className="text-lg text-muted-foreground">
                på {nextTurn.streetName}
              </div>
            )}
          </div>
        )}

        {/* Destinasjon */}
        {routeData?.to && (
          <div className="mb-6 text-center">
            <div className="text-lg text-muted-foreground mb-1">Til</div>
            <div className="text-2xl font-semibold">{routeData.to}</div>
          </div>
        )}

        {/* Ruteinfo i bunnen */}
        <div className="grid grid-cols-3 gap-8 text-center w-full max-w-md">
          <div>
            <div className="text-2xl font-bold">{formatDistance(remainingDistance)}</div>
            <div className="text-sm text-muted-foreground">Gjenstår</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatTime(remainingTime)}</div>
            <div className="text-sm text-muted-foreground">ETA {estimatedArrival}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Math.round(currentSpeed)} km/t</div>
            <div className="text-sm text-muted-foreground">Hastighet</div>
          </div>
        </div>
      </div>
    </div>
  );
};