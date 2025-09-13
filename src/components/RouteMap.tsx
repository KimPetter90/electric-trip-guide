import { useEffect, useRef, useState } from "react";
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Clock, DollarSign, MapPin, AlertCircle } from "lucide-react";

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
}

// Norske byer koordinater
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'bergen': { lat: 60.3913, lng: 5.3221 },
  'trondheim': { lat: 63.4305, lng: 10.3951 },
  'stavanger': { lat: 58.9700, lng: 5.7331 },
  'tromsø': { lat: 69.6492, lng: 18.9553 },
  'ålesund': { lat: 62.4722, lng: 6.1549 },
  'kristiansand': { lat: 58.1599, lng: 8.0182 },
  'drammen': { lat: 59.7439, lng: 10.2045 },
  'fredrikstad': { lat: 59.2181, lng: 10.9298 },
  'lillehammer': { lat: 61.1153, lng: 10.4662 },
  'bodø': { lat: 67.2804, lng: 14.4040 },
  'molde': { lat: 62.7372, lng: 7.1607 }
};

const mockChargingStations: ChargingStation[] = [
  {
    id: "1",
    name: "Circle K Gardermoen",
    location: "Jessheim",
    lat: 60.1939,
    lng: 11.1004,
    chargeTime: 25,
    chargeAmount: 35,
    cost: 175,
    fastCharger: true
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
    fastCharger: true
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
    fastCharger: true
  }
];

interface RouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel | null;
}

export default function RouteMap({ isVisible, routeData, selectedCar }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Beregn reiseinformasjon
  const calculateTripInfo = () => {
    if (!selectedCar) return null;
    
    const baseDistance = 500;
    const extraConsumption = routeData.trailerWeight > 0 ? routeData.trailerWeight * 0.15 / 1000 : 0;
    const totalConsumption = selectedCar.consumption + extraConsumption;
    const maxRange = selectedCar.range * (routeData.batteryPercentage / 100);
    const needsCharging = baseDistance > maxRange;
    
    return {
      distance: baseDistance,
      consumption: totalConsumption,
      range: maxRange,
      needsCharging
    };
  };

  const tripInfo = calculateTripInfo();

  // Hent Google Maps API key
  useEffect(() => {
    const fetchGoogleMapsKey = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/google-maps-proxy`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTQ0MDgsImV4cCI6MjA3MzM3MDQwOH0.KdDS_tT7LV7HuXN8Nw3dxUU3YRGobsJrkE2esDxgJH8`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.apiKey) {
          await initializeGoogleMaps(data.apiKey);
        } else {
          throw new Error('Ingen API-nøkkel mottatt');
        }
      } catch (err) {
        console.error('Feil ved henting av Google Maps API-nøkkel:', err);
        setError(err instanceof Error ? err.message : 'Ukjent feil');
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchGoogleMapsKey();
    }
  }, [isVisible]);

  // Initialiser Google Maps
  const initializeGoogleMaps = async (apiKey: string) => {
    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();

      if (mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 60.472, lng: 8.4689 }, // Midt i Norge
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ weight: "2.00" }]
            },
            {
              featureType: "all",
              elementType: "geometry.stroke",
              stylers: [{ color: "#9c9c9c" }]
            },
            {
              featureType: "all",
              elementType: "labels.text",
              stylers: [{ visibility: "on" }]
            }
          ]
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 6,
            strokeOpacity: 0.8
          },
          suppressMarkers: true // Vi legger til egne markører
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setLoading(false);
      }
    } catch (err) {
      console.error('Feil ved initialisering av Google Maps:', err);
      setError('Kunne ikke laste Google Maps');
      setLoading(false);
    }
  };

  // Oppdater kart når ruteinformasjon endres
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !routeData.from || !routeData.to) {
      return;
    }

    const fromCity = routeData.from.toLowerCase().trim();
    const toCity = routeData.to.toLowerCase().trim();
    
    const fromCoords = cityCoordinates[fromCity];
    const toCoords = cityCoordinates[toCity];

    if (!fromCoords || !toCoords) {
      console.warn('En eller begge byer ikke funnet:', fromCity, toCity);
      return;
    }

    // Fjern eksisterende markører
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    // Beregn rute
    const request: google.maps.DirectionsRequest = {
      origin: fromCoords,
      destination: toCoords,
      travelMode: google.maps.TravelMode.DRIVING,
      region: 'no'
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);

        const newMarkers: google.maps.Marker[] = [];

        // Start markør
        const startMarker = new google.maps.Marker({
          position: fromCoords,
          map: map,
          title: `Start: ${routeData.from}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="4"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="20" font-weight="bold">🚗</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          }
        });

        const startInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #10b981; font-weight: bold;">START: ${routeData.from.toUpperCase()}</h3>
              <p style="margin: 0; color: #666;">Reisens startpunkt</p>
            </div>
          `
        });

        startMarker.addListener('click', () => {
          startInfoWindow.open(map, startMarker);
        });

        newMarkers.push(startMarker);

        // Slutt markør
        const endMarker = new google.maps.Marker({
          position: toCoords,
          map: map,
          title: `Destinasjon: ${routeData.to}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="4"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="20" font-weight="bold">🏁</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          }
        });

        const endInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #ef4444; font-weight: bold;">MÅL: ${routeData.to.toUpperCase()}</h3>
              <p style="margin: 0; color: #666;">Reisens destinasjon</p>
            </div>
          `
        });

        endMarker.addListener('click', () => {
          endInfoWindow.open(map, endMarker);
        });

        newMarkers.push(endMarker);

        // Ladestasjoner - kun hvis nødvendig
        if (tripInfo?.needsCharging) {
          mockChargingStations.forEach((station, index) => {
            const chargingMarker = new google.maps.Marker({
              position: { lat: station.lat, lng: station.lng },
              map: map,
              title: station.name,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="35" height="35" viewBox="0 0 35 35" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="17.5" cy="17.5" r="15.5" fill="#fbbf24" stroke="white" stroke-width="3"/>
                    <text x="17.5" y="23" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚡</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(35, 35),
                anchor: new google.maps.Point(17.5, 17.5)
              }
            });

            const chargingInfoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #f59e0b; font-weight: bold;">${station.name}</h3>
                  <p style="margin: 0 0 8px 0; color: #666;">${station.location}</p>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <div style="text-align: center;">
                      <div style="font-weight: bold; color: #f59e0b;">⚡ ${station.chargeAmount} kWh</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="font-weight: bold; color: #f59e0b;">⏱️ ${station.chargeTime} min</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="font-weight: bold; color: #f59e0b;">💰 ${station.cost} kr</div>
                    </div>
                  </div>
                  ${station.fastCharger ? '<div style="margin-top: 8px; background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #92400e;">⚡ Hurtiglading</div>' : ''}
                </div>
              `
            });

            chargingMarker.addListener('click', () => {
              chargingInfoWindow.open(map, chargingMarker);
            });

            newMarkers.push(chargingMarker);
          });
        }

        setMarkers(newMarkers);
      } else {
        console.error('Kunne ikke beregne rute:', status);
        setError('Kunne ikke beregne rute mellom byene');
      }
    });
  }, [map, directionsService, directionsRenderer, routeData, tripInfo]);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          Google Maps Rute: {routeData.from || 'Start'} → {routeData.to || 'Destinasjon'}
        </h3>
        
        {loading && (
          <div className="h-96 rounded-lg border border-glass-border shadow-neon bg-background/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laster Google Maps...</p>
            </div>
          </div>
        )}

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Kunne ikke laste kartet: {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500 opacity-80"></div>
              <span>Google Maps rute</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Ladestasjoner</span>
            </div>
          </div>
        </div>

        {/* Trip information */}
        {selectedCar && tripInfo && (
          <div className="mt-4 p-3 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Reiseinformasjon</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Forbruk:</span>
                <div className="font-semibold">{tripInfo.consumption.toFixed(1)} kWh/100km</div>
              </div>
              <div>
                <span className="text-muted-foreground">Rekkevidde:</span>
                <div className="font-semibold">{Math.round(tripInfo.range)} km</div>
              </div>
              <div>
                <span className="text-muted-foreground">Batteri:</span>
                <div className="font-semibold">{routeData.batteryPercentage}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Henger:</span>
                <div className="font-semibold">{routeData.trailerWeight > 0 ? `${routeData.trailerWeight} kg` : 'Nei'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Ladestasjoner - kun hvis nødvendig */}
        {tripInfo?.needsCharging && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Anbefalte ladestopp:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {mockChargingStations.map((station, index) => (
                <div key={station.id} className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border hover:bg-primary/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center text-xs font-semibold">
                      ⚡
                    </div>
                    <h5 className="font-semibold text-xs">{station.name}</h5>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{station.location}</p>
                  
                  <div className="flex items-center justify-between text-xs">
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
                  
                  {station.fastCharger && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      <Zap className="h-3 w-3 mr-1" />
                      Hurtig
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}