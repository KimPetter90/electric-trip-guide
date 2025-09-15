import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Battery, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  // Load charging stations from database
  useEffect(() => {
    const loadChargingStations = async () => {
      try {
        console.log('🔌 Starter henting av ladestasjoner fra database...');
        const { data, error } = await supabase
          .from('charging_stations')
          .select('*');
        
        if (error) {
          console.error('Feil ved henting av ladestasjoner:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log(`✅ Hentet ${data.length} ladestasjoner fra database`);
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
          setChargingStations(mappedStations);
        } else {
          console.log('⚠️ Ingen ladestasjoner funnet i database');
        }
      } catch (err) {
        console.error('Feil ved henting av ladestasjoner:', err);
      }
    };

    loadChargingStations();
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
          libraries: ["geometry"]
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
            scale: 8,
            fillColor: "#00ff41", // NEON GREEN - GUARANTEED!
            fillOpacity: 1.0,
            strokeColor: "#ffffff",
            strokeWeight: 2
          },
          zIndex: 100
        });

        newMarkers.push(greenMarker);

        // Log every single green marker for first 20
        if (index < 20) {
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

          // Only add red markers for truly required stations when battery is critical
          if (isCriticalBattery && chargingStations.length > 0) {
            // Find closest station to route as example
            const criticalStation = chargingStations[0]; // Simplified for testing
            
            const redMarker = new google.maps.Marker({
              position: { lat: criticalStation.lat, lng: criticalStation.lng },
              map: map,
              title: `KRITISK: ${criticalStation.name}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 16,
                fillColor: '#ff0000', // RED for critical
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 4
              },
              zIndex: 1000
            });

            setAllMarkers(prev => [...prev, redMarker]);
            console.log(`🚨 RØD KRITISK MARKØR: ${criticalStation.name} - kun pga batteriet er på ${routeData.batteryPercentage}%`);
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
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          Google Maps Ruteplanlegger
          <Badge variant="secondary" className="ml-auto">
            {chargingStations.length} stasjoner
          </Badge>
        </h3>
        
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