import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Square, AlertTriangle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface NavigationOverlayProps {
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

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({
  routeData,
  onRouteDeviation
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [routeProgress, setRouteProgress] = useState<number>(0);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [routeDeviation, setRouteDeviation] = useState<boolean>(false);
  
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const routeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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

  const checkRouteDeviation = async (currentLoc: LocationData) => {
    if (!routeData?.from || !routeData?.to) return;

    const lastLoc = lastLocationRef.current;
    
    if (lastLoc) {
      const timeDiff = (currentLoc.timestamp - lastLoc.timestamp) / 1000;
      const distance = calculateDistance(lastLoc.latitude, lastLoc.longitude, currentLoc.latitude, currentLoc.longitude);
      const calculatedSpeed = timeDiff > 0 ? (distance / timeDiff) * 3600 : 0;
      
      setCurrentSpeed(calculatedSpeed);

      // Simple deviation detection
      const isDeviating = calculatedSpeed > 5 && Math.abs(calculatedSpeed - (currentLoc.speed || 0) * 3.6) > 20;
      
      if (isDeviating && !routeDeviation) {
        setRouteDeviation(true);
        
        toast({
          title: "⚠️ Avvik fra rute",
          description: "Beregner ny rute fra din nåværende posisjon...",
          duration: 4000,
        });

        // Get current location for rerouting
        if (onRouteDeviation) {
          const currentLocationText = `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`;
          onRouteDeviation(currentLocationText, routeData.to);
        }
        
        // Reset deviation flag after a delay
        setTimeout(() => setRouteDeviation(false), 10000);
      }
    }

    lastLocationRef.current = currentLoc;
  };

  const updateRouteProgress = (location: LocationData) => {
    if (!routeData?.from || !routeData?.to) return;

    // Simulate route progress
    const mockProgress = Math.min(95, routeProgress + Math.random() * 2);
    setRouteProgress(mockProgress);

    // Estimate arrival time
    if (currentSpeed > 0) {
      const remainingDistance = 100 * (1 - mockProgress / 100);
      const remainingTimeHours = remainingDistance / Math.max(currentSpeed, 30);
      const arrivalTime = new Date(Date.now() + remainingTimeHours * 60 * 60 * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }
  };

  const startNavigation = async () => {
    console.log('🧭 Starter navigasjon...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation ikke støttet');
      toast({
        title: "GPS ikke tilgjengelig",
        description: "Denne enheten støtter ikke GPS-posisjonering",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📍 Ber om GPS-tillatelse...');
      
      // Check permission first
      let permission: PermissionState = 'granted';
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        permission = permissionStatus.state;
        console.log('🔒 GPS-tillatelse status:', permission);
      } catch (permError) {
        console.warn('⚠️ Kunne ikke sjekke tillatelser:', permError);
      }

      if (permission === 'denied') {
        toast({
          title: "GPS-tilgang nektet",
          description: "Vennligst gi tillatelse til stedsdata i nettleserens innstillinger",
          variant: "destructive",
        });
        return;
      }

      // Get initial position with more lenient settings
      console.log('📡 Henter initial posisjon...');
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Fikk GPS-posisjon:', position.coords);
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
            console.error('❌ GPS-feil:', error);
            let errorMsg = 'Ukjent GPS-feil';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = 'GPS-tilgang ble nektet. Sjekk nettleserens innstillinger.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = 'GPS-posisjon ikke tilgjengelig. Prøv utendørs.';
                break;
              case error.TIMEOUT:
                errorMsg = 'GPS-forespørsel tok for lang tid. Prøv igjen.';
                break;
            }
            toast({
              title: "GPS-feil",
              description: errorMsg,
              variant: "destructive",
            });
            reject(error);
          },
          {
            enableHighAccuracy: false, // Start with less demanding settings
            timeout: 15000, // Longer timeout
            maximumAge: 300000 // Allow cached position
          }
        );
      });

      // Start continuous tracking with less demanding settings initially
      console.log('🔄 Starter kontinuerlig sporing...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log('📍 Ny posisjon mottatt');
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
          console.error('❌ GPS tracking feil:', error);
          stopNavigation();
          toast({
            title: "GPS-feil",
            description: "Kunne ikke følge posisjon. Navigasjon stoppet.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: false, // Start with less demanding, upgrade later
          timeout: 20000, // Longer timeout
          maximumAge: 60000
        }
      );

      // Route checking interval
      routeCheckIntervalRef.current = setInterval(() => {
        if (currentLocation) {
          updateRouteProgress(currentLocation);
        }
      }, 5000);

      setIsTracking(true);
      setRouteDeviation(false);
      
      console.log('✅ Navigasjon startet successfully');
      toast({
        title: "🧭 Navigasjon startet",
        description: "Følger din posisjon og ruten i sanntid",
      });
      
      // Upgrade to high accuracy after initial success
      setTimeout(() => {
        if (watchIdRef.current && navigator.geolocation) {
          console.log('⬆️ Oppgraderer til høy nøyaktighet...');
          navigator.geolocation.clearWatch(watchIdRef.current);
          
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
              console.warn('⚠️ High accuracy GPS feil, fortsetter med lavere nøyaktighet:', error);
              // Don't stop navigation, just continue with lower accuracy
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 30000
            }
          );
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Navigation start error:', error);
      toast({
        title: "Kunne ikke starte navigasjon",
        description: "Sjekk GPS-tillatelser og internettforbindelse. Prøv igjen.",
        variant: "destructive",
      });
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
    
    toast({
      title: "Navigasjon stoppet",
      description: "GPS-tracking er avsluttet",
    });
  };

  const formatSpeed = (speed?: number): string => {
    if (!speed || speed < 0) return '0';
    return Math.round(speed * 3.6).toString();
  };

  const formatHeading = (heading?: number): string => {
    if (!heading || heading < 0) return '';
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  if (!isTracking) {
    // Return the start button overlay
    return (
      <Button
        onClick={startNavigation}
        className="absolute top-3 left-3 z-20 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
        size="sm"
      >
        <Navigation className="h-4 w-4 mr-2" />
        Start reise
      </Button>
    );
  }

  // Return the minimal navigation overlay when tracking
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start gap-4">
      {/* Navigation info panel */}
      <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Navigation className="h-4 w-4 text-green-400 animate-pulse" />
          <Badge variant="default" className="text-xs">
            Navigerer
          </Badge>
          {routeDeviation && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Omrute
            </Badge>
          )}
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hastighet:</span>
            <span className="font-medium">{formatSpeed(currentLocation?.speed)} km/t</span>
          </div>
          
          {currentLocation?.heading && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retning:</span>
              <span className="font-medium">{formatHeading(currentLocation.heading)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fremdrift:</span>
            <span className="font-medium">{routeProgress.toFixed(0)}%</span>
          </div>
          
          {estimatedArrival && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ankomst:</span>
              <span className="font-medium">{estimatedArrival}</span>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div 
            className="bg-primary rounded-full h-1.5 transition-all duration-500"
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
  );
};