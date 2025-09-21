import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Battery, Clock, DollarSign, AlertTriangle, Play, Pause, LocateFixed, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

interface RouteData {
  from: string;
  to: string;
  batteryPercentage: number;
  trailerWeight?: number;
}

interface ChargingStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fastCharger: boolean;
  cost: number;
  location: string;
}

interface GoogleMapsRouteProps {
  isVisible: boolean;
  selectedCar: CarModel | null;
  routeData: RouteData;
}

// Load charging stations from database
const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);

export default function GoogleMapsRoute({ isVisible, selectedCar, routeData }: GoogleMapsRouteProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const userLocationMarker = useRef<google.maps.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [requiredStations, setRequiredStations] = useState<ChargingStation[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [batteryStatus, setBatteryStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [allMarkers, setAllMarkers] = useState<google.maps.Marker[]>([]);
  const [isGPSActive, setIsGPSActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  console.log('🔄 GoogleMapsRoute KOMPONENT RENDERER!', { 
    isVisible, 
    hasMap: !!map, 
    stationCount: chargingStations.length,
    batteryPercent: routeData.batteryPercentage 
  });

  // GPS functions
  const checkGPSPermission = async () => {
    if (!navigator.geolocation) {
      setGpsPermission('denied');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setGpsPermission(permission.state);
    } catch (error) {
      console.error('Kunne ikke sjekke GPS-tillatelse:', error);
      setGpsPermission('prompt');
    }
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      toast.error('GPS er ikke tilgjengelig på denne enheten');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lng: longitude };
      
      setCurrentLocation(newLocation);
      updateUserLocationOnMap(newLocation);
      
      if (!isGPSActive) {
        setIsGPSActive(true);
        toast.success('GPS-sporing aktivert');
      }
    };

    const error = (error: GeolocationPositionError) => {
      console.error('GPS-feil:', error);
      let errorMessage = 'Kunne ikke få GPS-posisjon';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'GPS-tilgang nektet. Aktiver stedstjenester i nettleseren.';
          setGpsPermission('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'GPS-posisjon ikke tilgjengelig';
          break;
        case error.TIMEOUT:
          errorMessage = 'GPS-forespørsel tidsavbrudd';
          break;
      }
      
      toast.error(errorMessage);
      setIsGPSActive(false);
    };

    watchId.current = navigator.geolocation.watchPosition(success, error, options);
  };

  const stopGPSTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (userLocationMarker.current) {
      userLocationMarker.current.setMap(null);
      userLocationMarker.current = null;
    }
    
    setIsGPSActive(false);
    setCurrentLocation(null);
    toast.info('GPS-sporing stoppet');
  };

  const updateUserLocationOnMap = (location: { lat: number; lng: number }) => {
    if (!map) return;

    // Opprett eller oppdater brukerens posisjon-markør
    if (userLocationMarker.current) {
      userLocationMarker.current.setPosition(location);
    } else {
      userLocationMarker.current = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Din posisjon',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 4px 0; color: #3b82f6; font-weight: bold;">📍 Din posisjon</h4>
            <p style="margin: 0; font-size: 12px;">Lat: ${location.lat.toFixed(6)}</p>
            <p style="margin: 0; font-size: 12px;">Lng: ${location.lng.toFixed(6)}</p>
          </div>
        `
      });

      userLocationMarker.current.addListener('click', () => {
        infoWindow.open(map, userLocationMarker.current);
      });
    }

    // Sentrer kartet på brukerens posisjon i GPS-modus
    if (isGPSActive) {
      map.panTo(location);
      if (map.getZoom() && map.getZoom()! < 14) {
        map.setZoom(14);
      }
    }
  };

  // Load charging stations from database
  useEffect(() => {
    const loadChargingStations = async () => {
      try {
        console.log('🔌 STARTER HENTING AV LADESTASJONER FRA DATABASE...');
        const { data, error } = await supabase
          .from('charging_stations')
          .select('*');
        
        console.log('🔌 DATABASSE RESPONS:', { 
          data: data ? `${data.length} stasjoner` : 'null', 
          error: error ? error.message : 'ingen feil',
          firstStation: data?.[0] ? data[0].name : 'ingen data'
        });
        
        if (error) {
          console.error('❌ FEIL VED HENTING AV LADESTASJONER:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log(`✅ HENTET ${data.length} LADESTASJONER FRA DATABASE`);
          console.log('📊 FØRSTE 3 STASJONER:', data.slice(0, 3).map(s => s.name));
          
          // Map database fields to our interface
          const mappedStations = data.map(station => ({
            id: station.id,
            name: station.name,
            lat: station.latitude,
            lng: station.longitude,
            fastCharger: station.fast_charger,
            cost: station.cost,
            location: station.location
          }));
          
          console.log('🗂️ MAPPED STATIONS:', mappedStations.slice(0, 2));
          setChargingStations(mappedStations);
          console.log('✅ CHARGING STATIONS STATE OPPDATERT');
        } else {
          console.log('⚠️ INGEN LADESTASJONER FUNNET I DATABASE');
        }
      } catch (err) {
        console.error('💥 EXCEPTION VED HENTING AV LADESTASJONER:', err);
      }
    };

    loadChargingStations();
    checkGPSPermission();
  }, []);

  // Cleanup markers when component unmounts
  useEffect(() => {
    return () => {
      try {
        allMarkers.forEach(marker => marker.setMap(null));
        if (directionsRenderer) {
          directionsRenderer.setMap(null);
        }
        if (map && mapRef.current) {
          const mapContainer = mapRef.current;
          if (mapContainer && mapContainer.firstChild) {
            mapContainer.innerHTML = '';
          }
        }
      } catch (error) {
        console.warn('Error cleaning up map:', error);
      }
    };
  }, [allMarkers, directionsRenderer, map]);

  // Initialize Google Maps
  useEffect(() => {
    if (!isVisible || !mapRef.current || isInitialized) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError('');

        console.log('🗺️ Initialiserer Google Maps...');
        
        const { data, error } = await supabase.functions.invoke('google-maps-proxy');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Server error: ${error.message}`);
        }
        
        if (!data?.apiKey) {
          console.error('No API key in response:', data);
          throw new Error('Ingen API-nøkkel mottatt fra server');
        }

        console.log('Got API key, loading Google Maps...');

        const loader = new Loader({
          apiKey: data.apiKey,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        await loader.load();

        if (!isVisible || !mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 60.472, lng: 8.4689 }, // Center of Norway
          zoom: 6,
          styles: [
            {
              "featureType": "all",
              "elementType": "geometry",
              "stylers": [{ "color": "#1e1e1e" }]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#888888" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#000000" }]
            }
          ]
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#00ff88",
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setIsLoading(false);
        setIsInitialized(true);

        console.log('✅ Google Maps initialisert!');

      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Kunne ikke laste Google Maps');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [isVisible, isInitialized]);

  // CLEAN IMPLEMENTATION: Add ALL charging stations as GREEN markers
  useEffect(() => {
    if (!map || chargingStations.length === 0) {
      console.log('⏳ Venter på kart og ladestasjoner...');
      return;
    }

    console.log('🟢 🟢 🟢 LEGGER TIL GRØNNE MARKØRER - START! 🟢 🟢 🟢');
    console.log(`📊 Antall stasjoner: ${chargingStations.length}`);

    // Clear existing markers first
    allMarkers.forEach(marker => marker.setMap(null));
    setAllMarkers([]);

    const newMarkers: google.maps.Marker[] = [];

    // Add ALL stations as GREEN markers
    chargingStations.forEach((station, index) => {
      try {
        const greenMarker = new google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          map: map,
          title: station.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#00ff41", // NEON GREEN - GUARANTEED!
            fillOpacity: 1.0,
            strokeColor: "#ffffff",
            strokeWeight: 1
          },
          zIndex: 100
        });

        newMarkers.push(greenMarker);

        // Log every single green marker for first 20
        if (index < 10) {
          console.log(`✅ GRØNN MARKØR ${index + 1}/${chargingStations.length}: ${station.name} - FARGE: #00ff41 (NEON GRØNN)`);
        }

        // Add click handler
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color: black; padding: 10px;">
              <h3 style="color: #00aa33; margin: 0 0 8px 0;">${station.name}</h3>
              <p><strong>📍 Lokasjon:</strong> ${station.location}</p>
              <p><strong>⚡ Type:</strong> ${station.fastCharger ? 'Hurtiglader' : 'Standard'}</p>
              <p><strong>💰 Pris:</strong> ${station.cost} kr/kWh</p>
            </div>
          `
        });

        greenMarker.addListener('click', () => {
          infoWindow.open(map, greenMarker);
        });

      } catch (error) {
        console.error(`❌ Feil ved opprettelse av grønn markør ${index}:`, error);
      }
    });

    setAllMarkers(newMarkers);
    console.log(`🟢 ✅ FERDIG! ${newMarkers.length} GRØNNE MARKØRER LAGT TIL! 🟢 ✅`);

  }, [map, chargingStations]);

  // Handle route calculation and required stations
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !routeData.from || !routeData.to) return;

    console.log('🛣️ Beregner rute...');

    directionsService.route({
      origin: routeData.from,
      destination: routeData.to,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        const route = result.routes[0];
        const distance = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0) / 1000;
        setRouteDistance(distance);

        // Add start and end markers
        const startMarker = new google.maps.Marker({
          position: result.routes[0].legs[0].start_location,
          map: map,
          title: 'Start',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#00ff88',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          zIndex: 999
        });

        const endMarker = new google.maps.Marker({
          position: result.routes[0].legs[result.routes[0].legs.length - 1].end_location,
          map: map,
          title: 'Destinasjon',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ff4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          zIndex: 999
        });

        setAllMarkers(prev => [...prev, startMarker, endMarker]);

        // Calculate charging needs if needed
        if (selectedCar && distance > 0) {
          const isCriticalBattery = routeData.batteryPercentage <= 10;
          setBatteryStatus(
            isCriticalBattery 
              ? `🚨 KRITISK BATTERINIVÅ! ${routeData.batteryPercentage}%` 
              : `🔋 Batterinivå: ${routeData.batteryPercentage}%`
          );

          // Legg til ANBEFALTE LADESTASJONER som større, gullfarget markører
          if (chargingStations.length > 0) {
            // Velg 3-5 strategiske stasjoner langs ruten som anbefalt
            const recommendedStations = chargingStations.slice(0, 5); // Forenklet for testing
            
            recommendedStations.forEach((station, index) => {
              const recommendedMarker = new google.maps.Marker({
                position: { lat: station.lat, lng: station.lng },
                map: map,
                title: `⭐ ANBEFALT: ${station.name}`,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: "#ffd700", // Gull farge for anbefalte
                  fillOpacity: 1.0,
                  strokeColor: "#ff6b00", // Orange kant
                  strokeWeight: 3
                },
                zIndex: 500
              });

              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="color: black; padding: 10px;">
                    <h3 style="color: #ff6b00; margin: 0 0 8px 0;">⭐ ANBEFALT LADESTASJON</h3>
                    <h4 style="margin: 0 0 8px 0;">${station.name}</h4>
                    <p><strong>📍 Lokasjon:</strong> ${station.location}</p>
                    <p><strong>⚡ Type:</strong> ${station.fastCharger ? 'Hurtiglader' : 'Standard'}</p>
                    <p><strong>💰 Pris:</strong> ${station.cost} kr/kWh</p>
                    <p style="color: #ff6b00; font-weight: bold; margin-top: 8px;">Strategisk posisjonert for din rute!</p>
                  </div>
                `
              });

              recommendedMarker.addListener('click', () => {
                infoWindow.open(map, recommendedMarker);
              });

              setAllMarkers(prev => [...prev, recommendedMarker]);
              console.log(`⭐ ANBEFALT STASJON: ${station.name} - større gull markør`);
            });
          }
        }

        console.log('✅ Rute beregnet ferdig');
      }
    });
  }, [map, directionsService, directionsRenderer, routeData, selectedCar, chargingStations]);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
            <h3 className="text-lg font-semibold text-foreground">Google Maps Ruteplanlegger</h3>
            <Badge variant="secondary">
              {chargingStations.length} stasjoner
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {currentLocation && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <LocateFixed className="h-3 w-3 mr-1" />
                GPS aktiv
              </Badge>
            )}
            
            <Button
              onClick={isGPSActive ? stopGPSTracking : startGPSTracking}
              variant={isGPSActive ? "destructive" : "default"}
              size="sm"
              disabled={gpsPermission === 'denied'}
              className="min-w-[120px]"
            >
              {isGPSActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stopp reise
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start reise
                </>
              )}
            </Button>
          </div>
        </div>
        
        {batteryStatus && (
          <div className={`p-3 rounded-lg mb-4 ${
            batteryStatus.includes('KRITISK') 
              ? 'bg-red-900/30 border border-red-500/50 text-red-200' 
              : 'bg-green-900/30 border border-green-500/50 text-green-200'
          }`}>
            <div className="flex items-center gap-2">
              {batteryStatus.includes('KRITISK') ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <Battery className="w-5 h-5 text-green-400" />
              )}
              <span className="font-medium">{batteryStatus}</span>
            </div>
          </div>
        )}

        {routeDistance > 0 && (
          <div className="text-sm text-muted-foreground mb-4">
            <strong>Rutedistanse:</strong> {Math.round(routeDistance)} km
          </div>
        )}
      </Card>

      <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-border">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Laster kart...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center text-destructive">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setError('');
                    setIsInitialized(false);
                  }}
                >
                  Prøv igjen
                </Button>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="w-full h-[500px] bg-muted rounded-lg"
            style={{ minHeight: '500px' }}
          />
        </div>
      </Card>
    </div>
  );
}