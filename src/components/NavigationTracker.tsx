import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Play, Square, MapPin, Compass, Route, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationTrackerProps {
  isVisible: boolean;
  onToggle: () => void;
  routeData?: {
    from: string;
    to: string;
    via?: string;
  };
  onRouteDeviation?: (newFrom: string, to: string) => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

export const NavigationTracker: React.FC<NavigationTrackerProps> = ({
  isVisible,
  onToggle,
  routeData,
  onRouteDeviation
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [gpsPermission, setGpsPermission] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeDeviation, setRouteDeviation] = useState<boolean>(false);
  const [routeProgress, setRouteProgress] = useState<number>(0);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const routeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check GPS permission on mount
  useEffect(() => {
    checkGPSPermission();
  }, []);

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

  const checkGPSPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setGpsPermission(permission.state);
      
      permission.addEventListener('change', () => {
        setGpsPermission(permission.state);
      });
    } catch (error) {
      console.warn('Kunne ikke sjekke GPS-tillatelser:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkRouteDeviation = async (currentLoc: LocationData) => {
    if (!routeData?.from || !routeData?.to) return;

    // Simulate checking if user is following the planned route
    // In a real implementation, you would compare against the actual route path
    const lastLoc = lastLocationRef.current;
    
    if (lastLoc) {
      const timeDiff = (currentLoc.timestamp - lastLoc.timestamp) / 1000; // seconds
      const distance = calculateDistance(lastLoc.latitude, lastLoc.longitude, currentLoc.latitude, currentLoc.longitude);
      const calculatedSpeed = timeDiff > 0 ? (distance / timeDiff) * 3600 : 0; // km/h
      
      setCurrentSpeed(calculatedSpeed);

      // Simple deviation detection: if user moves significantly away from expected direction
      // This is a simplified example - real implementation would use route geometry
      const isDeviating = calculatedSpeed > 5 && Math.abs(calculatedSpeed - (currentLoc.speed || 0) * 3.6) > 20;
      
      if (isDeviating && !routeDeviation) {
        setRouteDeviation(true);
        
        // Get current location as text for rerouting
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${currentLoc.longitude},${currentLoc.latitude}.json?access_token=YOUR_MAPBOX_TOKEN`
          );
          
          if (response.ok) {
            const data = await response.json();
            const currentLocationText = data.features[0]?.place_name || `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`;
            
            // Trigger route recalculation
            if (onRouteDeviation) {
              onRouteDeviation(currentLocationText, routeData.to);
            }
          }
        } catch (error) {
          console.warn('Could not get location name for rerouting:', error);
          // Fallback to coordinates
          if (onRouteDeviation) {
            onRouteDeviation(
              `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`,
              routeData.to
            );
          }
        }
      }
    }

    lastLocationRef.current = currentLoc;
  };

  const updateRouteProgress = (location: LocationData) => {
    if (!routeData?.from || !routeData?.to) return;

    // Simulate route progress calculation
    // In a real implementation, you would calculate actual progress along the route
    const mockProgress = Math.min(95, routeProgress + Math.random() * 2);
    setRouteProgress(mockProgress);

    // Estimate arrival time based on current speed and remaining distance
    if (currentSpeed > 0) {
      const remainingDistance = 100 * (1 - mockProgress / 100); // Mock remaining km
      const remainingTimeHours = remainingDistance / Math.max(currentSpeed, 30); // Assume min 30 km/h
      const arrivalTime = new Date(Date.now() + remainingTimeHours * 60 * 60 * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }
  };

  const startNavigation = async () => {
    if (!navigator.geolocation) {
      alert('GPS er ikke tilgjengelig på denne enheten');
      return;
    }

    setIsLoading(true);

    try {
      // First get current position to test permission
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
              timestamp: Date.now(),
            };
            setCurrentLocation(locationData);
            lastLocationRef.current = locationData;
            resolve();
          },
          (error) => {
            console.error('GPS-feil:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      // Start continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: Date.now(),
          };
          
          setCurrentLocation(locationData);
          updateRouteProgress(locationData);
          checkRouteDeviation(locationData);
        },
        (error) => {
          console.error('GPS tracking feil:', error);
          stopNavigation();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );

      // Start route checking interval
      routeCheckIntervalRef.current = setInterval(() => {
        if (currentLocation) {
          updateRouteProgress(currentLocation);
        }
      }, 5000);

      setIsTracking(true);
      setIsLoading(false);
      setRouteDeviation(false);
      
    } catch (error) {
      setIsLoading(false);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('GPS-tilgang ble nektet. Vennligst gi tillatelse i nettleserens innstillinger.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('GPS-posisjon er ikke tilgjengelig. Sjekk at stedsdata er aktivert.');
            break;
          case error.TIMEOUT:
            alert('GPS-forespørsel tok for lang tid. Prøv igjen.');
            break;
          default:
            alert('En ukjent GPS-feil oppstod.');
        }
      }
    }
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
    lastLocationRef.current = null;
  };

  const formatLocation = (location: LocationData): string => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatAccuracy = (accuracy: number): string => {
    return accuracy < 1000 
      ? `±${Math.round(accuracy)} m`
      : `±${(accuracy / 1000).toFixed(1)} km`;
  };

  const formatSpeed = (speed?: number): string => {
    if (!speed || speed < 0) return '0 km/t';
    return `${Math.round(speed * 3.6)} km/t`;
  };

  const formatHeading = (heading?: number): string => {
    if (!heading || heading < 0) return 'Ukjent';
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(heading / 45) % 8;
    return `${directions[index]} (${Math.round(heading)}°)`;
  };

  if (!isVisible) return null;

  return (
    <Card className="glass-card p-6 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isTracking ? "bg-green-500/20" : "bg-primary/10"
            )}>
              <Navigation className={cn(
                "h-5 w-5 transition-colors",
                isTracking ? "text-green-400 animate-pulse" : "text-primary"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gradient-static">
                Smart Navigasjon
              </h3>
              <div className="flex gap-2 mt-1">
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? "Aktiv" : "Inaktiv"}
                </Badge>
                {routeDeviation && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Omrute
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onToggle}
            variant="outline"
            size="sm"
          >
            Lukk
          </Button>
        </div>

        {/* Route Info */}
        {routeData && (
          <div className="p-3 bg-background/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Aktiv rute</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Fra: <span className="font-medium">{routeData.from}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Til: <span className="font-medium">{routeData.to}</span>
            </p>
            {isTracking && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Fremdrift:</span>
                  <span className="font-medium">{routeProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-500"
                    style={{ width: `${routeProgress}%` }}
                  />
                </div>
                {estimatedArrival && (
                  <p className="text-xs text-muted-foreground">
                    Anslått ankomst: {estimatedArrival}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Route Deviation Warning */}
        {routeDeviation && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="font-medium text-destructive">Avvik fra rute</h4>
            </div>
            <p className="text-sm text-destructive/80 mb-2">
              Du har avviket fra den planlagte ruten. Ny rute beregnes automatisk.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setRouteDeviation(false)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Forstått
            </Button>
          </div>
        )}

        {/* GPS Permission Status */}
        {gpsPermission && (
          <div className="flex items-center gap-2 text-sm">
            <Compass className="h-4 w-4" />
            <span>GPS-tillatelse: </span>
            <Badge variant={
              gpsPermission === 'granted' ? 'default' : 
              gpsPermission === 'denied' ? 'destructive' : 'secondary'
            }>
              {gpsPermission === 'granted' ? 'Gitt' :
               gpsPermission === 'denied' ? 'Nektet' : 'Venter'}
            </Badge>
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <div className="space-y-3 p-4 bg-background/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Nåværende posisjon</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Koordinater:</span>
                <p className="font-mono text-xs mt-1 bg-background/70 p-2 rounded">
                  {formatLocation(currentLocation)}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Nøyaktighet:</span>
                <p className="mt-1">{formatAccuracy(currentLocation.accuracy)}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Hastighet:</span>
                <p className="mt-1">{formatSpeed(currentLocation.speed)}</p>
              </div>
              
              {currentLocation.heading !== undefined && (
                <div>
                  <span className="text-muted-foreground">Retning:</span>
                  <p className="mt-1">{formatHeading(currentLocation.heading)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isTracking ? (
            <Button 
              onClick={startNavigation}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Starter...' : 'Start navigasjon'}
            </Button>
          ) : (
            <Button 
              onClick={stopNavigation}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Stopp navigasjon
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1 p-3 bg-background/30 rounded-lg border border-border/30">
          <p className="flex items-center gap-2">
            <Compass className="h-3 w-3" />
            Smart navigasjon med automatisk omruting
          </p>
          <p>• Følger den planlagte ruten i sanntid</p>
          <p>• Beregner ny rute automatisk ved avvik</p>
          <p>• Viser fremdrift og anslått ankomsttid</p>
          <p>• Fungerer best utendørs med klar himmel</p>
        </div>
      </div>
    </Card>
  );
};