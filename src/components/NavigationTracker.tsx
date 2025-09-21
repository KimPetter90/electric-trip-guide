import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Play, Square, MapPin, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationTrackerProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
}

export const NavigationTracker: React.FC<NavigationTrackerProps> = ({
  isVisible,
  onToggle
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [gpsPermission, setGpsPermission] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Check GPS permission on mount
  useEffect(() => {
    checkGPSPermission();
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
            };
            setCurrentLocation(locationData);
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
          };
          setCurrentLocation(locationData);
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

      setIsTracking(true);
      setIsLoading(false);
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
    setIsTracking(false);
    setCurrentLocation(null);
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
                GPS Navigasjon
              </h3>
              <Badge variant={isTracking ? "default" : "secondary"} className="mt-1">
                {isTracking ? "Aktiv" : "Inaktiv"}
              </Badge>
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
              
              {currentLocation.speed !== undefined && (
                <div>
                  <span className="text-muted-foreground">Hastighet:</span>
                  <p className="mt-1">{formatSpeed(currentLocation.speed)}</p>
                </div>
              )}
              
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
              {isLoading ? 'Starter...' : 'Start reisen'}
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
            GPS-tracking følger deg i sanntid under reisen
          </p>
          <p>• Trykk "Start reisen" for å aktivere posisjonssporing</p>
          <p>• Appen vil vise din nøyaktige posisjon og bevegelse</p>
          <p>• Fungerer best utendørs med klar himmel</p>
        </div>
      </div>
    </Card>
  );
};