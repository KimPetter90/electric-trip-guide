import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Navigation, Square, AlertTriangle, MapPin, Clock, Route, Compass, Car, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { NavigationFerryInfo } from './NavigationFerryInfo';
import { DriverNavigationView } from './DriverNavigationView';

interface EnhancedNavigationOverlayProps {
  routeData?: {
    from: string;
    to: string;
    via?: string;
  };
  onRouteDeviation?: (newFrom: string, to: string) => void;
  onLocationUpdate?: (location: LocationData) => void;
  onNavigationStart?: (startLocation: LocationData) => void;
  onStartCarNavigation?: () => void; // Ny prop for bil-navigasjon
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface NextTurn {
  direction: 'left' | 'right' | 'straight' | 'u-turn';
  distance: number;
  instruction: string;
  streetName?: string;
}

export const EnhancedNavigationOverlay: React.FC<EnhancedNavigationOverlayProps> = ({
  routeData,
  onRouteDeviation,
  onLocationUpdate,
  onNavigationStart,
  onStartCarNavigation
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [routeProgress, setRouteProgress] = useState<number>(0);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [routeDeviation, setRouteDeviation] = useState<boolean>(false);
  const [nextTurn, setNextTurn] = useState<NextTurn | null>(null);
  const [showDriverView, setShowDriverView] = useState<boolean>(false);
  
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const routeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Mock turn-by-turn instructions
  const mockTurns: NextTurn[] = [
    { direction: 'straight', distance: 500, instruction: 'Fortsett rett frem', streetName: 'Storgata' },
    { direction: 'right', distance: 200, instruction: 'Sving til høyre', streetName: 'Kongens gate' },
    { direction: 'left', distance: 800, instruction: 'Sving til venstre', streetName: 'Jernbanetorget' },
    { direction: 'straight', distance: 1200, instruction: 'Fortsett rett frem', streetName: 'Ring 3' }
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (routeCheckIntervalRef.current) {
        clearInterval(routeCheckIntervalRef.current);
      }
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateTurnByTurnInstructions = (location: LocationData) => {
    // Simulate turn-by-turn navigation
    const progress = routeProgress / 100;
    const turnIndex = Math.floor(progress * mockTurns.length);
    
    if (turnIndex < mockTurns.length) {
      const turn = mockTurns[turnIndex];
      const adjustedDistance = turn.distance * (1 - (progress * mockTurns.length - turnIndex));
      
      setNextTurn({
        ...turn,
        distance: Math.max(50, adjustedDistance)
      });
    } else {
      setNextTurn(null);
    }
  };

  const checkRouteDeviation = async (currentLoc: LocationData) => {
    if (!routeData?.from || !routeData?.to) return;

    const lastLoc = lastLocationRef.current;
    
    if (lastLoc) {
      const timeDiff = (currentLoc.timestamp - lastLoc.timestamp) / 1000;
      const distance = calculateDistance(lastLoc.latitude, lastLoc.longitude, currentLoc.latitude, currentLoc.longitude);
      const calculatedSpeed = timeDiff > 0 ? (distance / timeDiff) * 3600 : 0;
      
      setCurrentSpeed(Math.max(calculatedSpeed, currentLoc.speed ? currentLoc.speed * 3.6 : 0));

      // Simple deviation detection
      const isDeviating = calculatedSpeed > 5 && Math.abs(calculatedSpeed - (currentLoc.speed || 0) * 3.6) > 20;
      
      if (isDeviating && !routeDeviation) {
        setRouteDeviation(true);
        
        toast({
          title: "⚠️ Avvik fra rute",
          description: "Beregner ny rute fra din nåværende posisjon...",
          duration: 4000,
        });

        if (onRouteDeviation) {
          const currentLocationText = `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`;
          onRouteDeviation(currentLocationText, routeData.to);
        }
        
        setTimeout(() => setRouteDeviation(false), 10000);
      }
    }

    lastLocationRef.current = currentLoc;
  };

  const updateRouteProgress = (location: LocationData) => {
    if (!routeData?.from || !routeData?.to) return;

    // Simulate realistic route progress
    const mockProgress = Math.min(95, routeProgress + Math.random() * 1.5);
    setRouteProgress(mockProgress);

    // Calculate remaining distance and time
    const totalDistance = 45; // Mock total distance in km
    const remaining = totalDistance * (1 - mockProgress / 100);
    setRemainingDistance(remaining);

    if (currentSpeed > 0) {
      const remainingTimeHours = remaining / Math.max(currentSpeed, 30);
      setRemainingTime(remainingTimeHours * 60); // Convert to minutes
      
      const arrivalTime = new Date(Date.now() + remainingTimeHours * 60 * 60 * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }

    // Update turn instructions
    updateTurnByTurnInstructions(location);
  };

  const startNavigation = async () => {
    console.log('🧭 Starter førerperspektiv navigasjon...');
    
    // Immediately show driver perspective - no GPS needed for demo
    setIsTracking(true);
    setShowDriverView(true);
    
    // Mock location data for demo
    const mockLocation: LocationData = {
      latitude: 59.9139,
      longitude: 10.7522,
      accuracy: 5,
      heading: 45,
      speed: 15, // 15 m/s = ~54 km/h
      timestamp: Date.now(),
    };
    
    setCurrentLocation(mockLocation);
    setRouteProgress(25);
    setCurrentSpeed(54);
    setRemainingDistance(12.5);
    setRemainingTime(15);
    setEstimatedArrival('15:42');
    
    // Set up mock turn instruction
    setNextTurn({
      direction: 'right',
      distance: 500,
      instruction: 'Sving til høyre',
      streetName: 'Kongens gate'
    });
    
    toast({
      title: "🚗 Førerperspektiv aktivert",
      description: "Navigasjonen er startet",
      duration: 2000,
    });
    
    console.log('🚗 Førerperspektiv aktivert!');
  };

  const startDriverView = () => {
    startNavigation();
    setTimeout(() => {
      setShowDriverView(true);
    }, 1000);
  };

  const startFirstPersonView = () => {
    startNavigation();
    setTimeout(() => {
      setShowDriverView(true);
    }, 1000);
  };

  const startCarNavigation = () => {
    startNavigation();
    setTimeout(() => {
      onStartCarNavigation?.();
    }, 1000);
  };

  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (routeCheckIntervalRef.current) {
      clearInterval(routeCheckIntervalRef.current);
      routeCheckIntervalRef.current = null;
    }
    setIsTracking(false);
    setCurrentLocation(null);
    setRouteDeviation(false);
    setRouteProgress(0);
    setEstimatedArrival('');
    setCurrentSpeed(0);
    setRemainingDistance(0);
    setRemainingTime(0);
    setNextTurn(null);
    setShowDriverView(false);
    lastLocationRef.current = null;
    
    toast({
      title: "Navigasjon stoppet",
      description: "GPS-tracking er avsluttet",
    });
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}t ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const getDirectionIcon = (direction: string) => {
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

  if (!isTracking) {
    return (
      <div className="absolute top-3 left-3 z-50">
        <Button
          onClick={() => {
            console.log('🧭 FØRERPERSPEKTIV KNAPP TRYKKET!');
            setIsTracking(true);
            setShowDriverView(true);
            console.log('🚗 State endret - showDriverView:', true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-4 border-yellow-400"
          size="lg"
        >
          <Car className="h-5 w-5 mr-2" />
          START FØRERPERSPEKTIV
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Ferry Information */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 py-1">
        <NavigationFerryInfo
          currentLocation={currentLocation ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          } : undefined}
          destination={routeData?.to}
          isVisible={true}
        />
      </div>

      {/* Next Turn Instructions - Large and prominent */}
      {nextTurn && (
        <div className="absolute top-12 left-3 right-3 z-30">
          <Card className="bg-blue-600/95 backdrop-blur-sm border-blue-500/50 text-white">
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  {getDirectionIcon(nextTurn.direction)}
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold">
                    {formatDistance(nextTurn.distance / 1000)}
                  </div>
                  <div className="text-lg opacity-90">
                    {nextTurn.instruction}
                  </div>
                  {nextTurn.streetName && (
                    <div className="text-sm opacity-75">
                      på {nextTurn.streetName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Compact navigation info */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex justify-between items-end gap-4">
        {/* Trip info */}
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-3 flex-1">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <Route className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="font-bold">{formatDistance(remainingDistance)}</div>
              <div className="text-xs text-muted-foreground">Gjenstår</div>
            </div>
            <div className="text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="font-bold">{formatTime(remainingTime)}</div>
              <div className="text-xs text-muted-foreground">ETA {estimatedArrival}</div>
            </div>
            <div className="text-center">
              <Navigation className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <div className="font-bold">{Math.round(currentSpeed)} km/t</div>
              <div className="text-xs text-muted-foreground">Hastighet</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-3">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-500"
              style={{ width: `${routeProgress}%` }}
            />
          </div>
        </div>

        {/* Stop button */}
        <Button 
          onClick={stopNavigation}
          variant="destructive"
          size="sm"
          className="bg-destructive/90 hover:bg-destructive shadow-lg backdrop-blur-sm"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* Driver Navigation View */}
      <DriverNavigationView
        userLocation={currentLocation || undefined}
        routeData={routeData}
        isActive={showDriverView}
        onExit={() => setShowDriverView(false)}
        nextTurn={nextTurn || undefined}
        remainingDistance={remainingDistance}
        remainingTime={remainingTime}
        estimatedArrival={estimatedArrival}
        currentSpeed={currentSpeed}
      />
    </>
  );
};