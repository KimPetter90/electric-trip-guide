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
  trailerWeight: number;
  batteryPercentage: number;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  chargeTime: number;
  chargeAmount: number;
  cost: number;
  fastCharger: boolean;
  requiredStop: boolean;
}

interface GoogleMapsRouteProps {
  isVisible: boolean;
  selectedCar: CarModel | null;
  routeData: RouteData;
}

// Mock charging stations in Norway
const chargingStations: ChargingStation[] = [
  {
    id: "1",
    name: "Circle K Gardermoen",
    location: "Jessheim",
    lat: 60.1939,
    lng: 11.1004,
    chargeTime: 25,
    chargeAmount: 35,
    cost: 175,
    fastCharger: true,
    requiredStop: false
  },
  {
    id: "2",
    name: "Ionity Lillehammer",
    location: "Lillehammer", 
    lat: 61.1153,
    lng: 10.4662,
    chargeTime: 30,
    chargeAmount: 45,
    cost: 225,
    fastCharger: true,
    requiredStop: false
  },
  {
    id: "3",
    name: "Mer Gol",
    location: "Gol",
    lat: 60.6856,
    lng: 9.0072,
    chargeTime: 35,
    chargeAmount: 50,
    cost: 250,
    fastCharger: true,
    requiredStop: false
  }
];

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
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Calculate if charging is needed based on battery percentage and route
  const calculateChargingNeeds = (distance: number, car: CarModel, batteryPercentage: number, trailerWeight: number) => {
    if (!car) return { needsCharging: false, stations: [] };

    // Calculate actual range with current battery and trailer
    const trailerPenalty = trailerWeight > 0 ? 1 + (trailerWeight * 0.15 / 1000) : 1;
    const actualRange = (car.range * (batteryPercentage / 100)) / trailerPenalty;
    
    const needsCharging = distance > actualRange;
    
    if (needsCharging) {
      // Mark stations as required based on distance
      const stationsWithRequirement = chargingStations.map(station => ({
        ...station,
        requiredStop: distance > actualRange
      }));
      
      return { 
        needsCharging: true, 
        stations: stationsWithRequirement,
        actualRange,
        shortfall: distance - actualRange
      };
    }
    
    return { 
      needsCharging: false, 
      stations: chargingStations.map(s => ({ ...s, requiredStop: false })),
      actualRange
    };
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up markers
      markers.forEach(marker => {
        if (marker) {
          marker.setMap(null);
        }
      });
      
      // Clean up directions renderer
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      
      // Clean up map
      if (map && mapRef.current) {
        try {
          // Clear the map container safely
          const mapContainer = mapRef.current;
          if (mapContainer && mapContainer.firstChild) {
            mapContainer.innerHTML = '';
          }
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, [map, directionsRenderer, markers]);

  useEffect(() => {
    if (!isVisible || !mapRef.current || isInitialized) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Get API key from Supabase edge function
        const { data, error: apiError } = await supabase.functions.invoke('google-maps-proxy');
        
        if (apiError || !data?.apiKey) {
          throw new Error('Kunne ikke hente Google Maps API-nøkkel');
        }

        const loader = new Loader({
          apiKey: data.apiKey,
          version: "weekly",
          libraries: ["geometry"]
        });

        await loader.load();

        // Check if the component is still mounted and visible
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

      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Kunne ikke laste Google Maps');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [isVisible, isInitialized]);

  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !routeData.from || !routeData.to) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    directionsService.route({
      origin: routeData.from,
      destination: routeData.to,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        const route = result.routes[0];
        const distance = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0) / 1000; // Convert to km
        setRouteDistance(distance);

        if (selectedCar) {
          const chargingNeeds = calculateChargingNeeds(distance, selectedCar, routeData.batteryPercentage, routeData.trailerWeight);
          setRequiredStations(chargingNeeds.stations);
          
          if (chargingNeeds.needsCharging) {
            setBatteryStatus(`Trenger lading! Mangler ${Math.round(chargingNeeds.shortfall || 0)} km rekkevidde`);
          } else {
            setBatteryStatus(`Rekkevidde OK! ${Math.round(chargingNeeds.actualRange || 0)} km tilgjengelig`);
          }
        }

        // Add charging station markers
        const newMarkers: google.maps.Marker[] = [];
        chargingStations.forEach(station => {
          const marker = new google.maps.Marker({
            position: { lat: station.lat, lng: station.lng },
            map: map,
            title: station.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: station.requiredStop ? "#ff4444" : "#00ff88",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: black; font-family: Arial, sans-serif;">
                <h3>${station.name}</h3>
                <p><strong>Lokasjon:</strong> ${station.location}</p>
                <p><strong>Ladetid:</strong> ${station.chargeTime} min</p>
                <p><strong>Energi:</strong> ${station.chargeAmount} kWh</p>
                <p><strong>Kostnad:</strong> ${station.cost} kr</p>
                ${station.requiredStop ? '<p style="color: red;"><strong>Nødvendig stopp!</strong></p>' : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        });

        setMarkers(newMarkers);
      }
    });
  }, [map, directionsService, directionsRenderer, routeData, selectedCar]);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          Google Maps Rutekart
        </h3>
        
        {/* Battery Status Alert */}
        {batteryStatus && selectedCar && (
          <div className={`mb-4 p-3 rounded-lg border ${
            batteryStatus.includes('Trenger lading') 
              ? 'bg-destructive/10 border-destructive text-destructive' 
              : 'bg-primary/10 border-primary text-primary'
          }`}>
            <div className="flex items-center gap-2">
              {batteryStatus.includes('Trenger lading') ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Battery className="h-4 w-4" />
              )}
              <span className="font-medium">{batteryStatus}</span>
            </div>
            <div className="text-sm mt-1 opacity-80">
              Rute: {Math.round(routeDistance)} km | Batteri: {routeData.batteryPercentage}%
              {routeData.trailerWeight > 0 && ` | Henger: ${routeData.trailerWeight}kg`}
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef}
          className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon bg-background/20"
          style={{ minHeight: '384px' }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full absolute inset-0 bg-background/50 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laster Google Maps...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full absolute inset-0 bg-background/50 backdrop-blur-sm z-10">
              <div className="text-center text-destructive">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
                <p className="font-medium">Kunne ikke laste kartet</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gradient-electric opacity-80"></div>
              <span>Planlagt rute</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-electric"></div>
              <span>Anbefalt ladestasjon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span>Nødvendig ladestasjon</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Charging Stations List */}
      {requiredStations.length > 0 && (
        <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
          <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Ladestasjoner på ruten
          </h4>
          
          <div className="space-y-3">
            {requiredStations.map((station, index) => (
              <div 
                key={station.id} 
                className={`bg-background/50 rounded-lg p-3 border ${
                  station.requiredStop 
                    ? 'border-destructive bg-destructive/5' 
                    : 'border-glass-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    station.requiredStop 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'bg-gradient-electric text-primary-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <h5 className="font-semibold text-sm flex-1">{station.name}</h5>
                  {station.requiredStop && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Nødvendig
                    </Badge>
                  )}
                  {station.fastCharger && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Hurtig
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{station.location}</p>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{station.chargeTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span>{station.chargeAmount} kWh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>{station.cost} kr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}