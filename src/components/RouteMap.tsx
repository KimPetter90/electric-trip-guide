import { useEffect, useRef, useState } from "react";
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Thermometer, Wind, Car, Battery, Navigation, TrendingUp } from "lucide-react";

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
  available: number;
  total: number;
  distance?: number;
  arrivalBattery?: number;
  departureBattery?: number;
}

interface WeatherData {
  temperature: number;
  wind: number;
  condition: string;
  impactOnRange: number;
}

interface TripAnalysis {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  chargingTime: number;
  co2Saved: number;
  efficiency: number;
  weather: WeatherData;
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

// Utvidet database av ladestasjoner
const allChargingStations: ChargingStation[] = [
  // Oslo området
  { id: "1", name: "Tesla Supercharger Gardermoen", location: "Oslo Lufthavn", lat: 60.1939, lng: 11.1004, chargeTime: 20, chargeAmount: 50, cost: 250, fastCharger: true, available: 8, total: 12 },
  { id: "2", name: "Ionity Jessheim", location: "Jessheim", lat: 60.1567, lng: 11.1675, chargeTime: 25, chargeAmount: 55, cost: 275, fastCharger: true, available: 4, total: 6 },
  { id: "3", name: "Circle K Lillestrøm", location: "Lillestrøm", lat: 59.9561, lng: 11.0461, chargeTime: 35, chargeAmount: 40, cost: 200, fastCharger: false, available: 2, total: 4 },
  
  // Bergen området
  { id: "4", name: "Ionity Bergen Flesland", location: "Bergen", lat: 60.2934, lng: 5.2181, chargeTime: 22, chargeAmount: 52, cost: 260, fastCharger: true, available: 6, total: 8 },
  { id: "5", name: "Mer Bergen Sentrum", location: "Bergen", lat: 60.3913, lng: 5.3221, chargeTime: 40, chargeAmount: 35, cost: 175, fastCharger: false, available: 3, total: 6 },
  
  // Mellom Oslo og Bergen
  { id: "6", name: "Ionity Lillehammer", location: "Lillehammer", lat: 61.1153, lng: 10.4662, chargeTime: 24, chargeAmount: 54, cost: 270, fastCharger: true, available: 5, total: 8 },
  { id: "7", name: "Tesla Supercharger Hønefoss", location: "Hønefoss", lat: 60.1681, lng: 10.2597, chargeTime: 21, chargeAmount: 51, cost: 255, fastCharger: true, available: 7, total: 10 },
  { id: "8", name: "Eviny Fagernes", location: "Fagernes", lat: 61.0067, lng: 9.2881, chargeTime: 30, chargeAmount: 45, cost: 225, fastCharger: true, available: 2, total: 4 },
  { id: "9", name: "Mer Gol", location: "Gol", lat: 60.6856, lng: 9.0072, chargeTime: 35, chargeAmount: 42, cost: 210, fastCharger: false, available: 1, total: 3 },
  
  // Trondheim området
  { id: "10", name: "Tesla Supercharger Trondheim", location: "Trondheim", lat: 63.4305, lng: 10.3951, chargeTime: 19, chargeAmount: 56, cost: 280, fastCharger: true, available: 12, total: 16 },
  { id: "11", name: "Ionity Oppdal", location: "Oppdal", lat: 62.5948, lng: 9.6915, chargeTime: 26, chargeAmount: 48, cost: 240, fastCharger: true, available: 3, total: 6 },
  
  // Stavanger området  
  { id: "12", name: "Eviny Stavanger", location: "Stavanger", lat: 58.9700, lng: 5.7331, chargeTime: 28, chargeAmount: 46, cost: 230, fastCharger: true, available: 4, total: 8 },
  
  // Ålesund området
  { id: "13", name: "Ionity Ålesund", location: "Ålesund", lat: 62.4722, lng: 6.1549, chargeTime: 25, chargeAmount: 50, cost: 250, fastCharger: true, available: 5, total: 6 },
  { id: "14", name: "Circle K Molde", location: "Molde", lat: 62.7372, lng: 7.1607, chargeTime: 33, chargeAmount: 38, cost: 190, fastCharger: false, available: 2, total: 4 }
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
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [activeTab, setActiveTab] = useState("map");

  // Simuler værdata (i en ekte app ville dette komme fra en vær-API)
  const getWeatherData = (): WeatherData => ({
    temperature: Math.round(Math.random() * 20 - 5), // -5 til 15°C
    wind: Math.round(Math.random() * 15), // 0-15 m/s
    condition: ["Overskyet", "Sol", "Regn", "Snø"][Math.floor(Math.random() * 4)],
    impactOnRange: Math.round((Math.random() - 0.5) * 20) // ±10% påvirkning
  });

  // Intelligent ladestasjonsoptimalisering
  const optimizeChargingStations = (routeDistance: number) => {
    if (!selectedCar) return [];

    const weather = getWeatherData();
    const trailerImpact = routeData.trailerWeight > 0 ? 15 : 0;
    const weatherImpact = weather.impactOnRange;
    const totalImpact = trailerImpact + weatherImpact;
    
    const effectiveRange = selectedCar.range * (1 - totalImpact / 100) * (routeData.batteryPercentage / 100);
    const safetyMargin = 50; // 50km sikkerhet
    const usableRange = effectiveRange - safetyMargin;

    const stations: ChargingStation[] = [];
    let currentDistance = 0;
    let currentBattery = routeData.batteryPercentage;

    // Finn nærmeste stasjoner på ruten
    const fromCity = routeData.from.toLowerCase().trim();
    const toCity = routeData.to.toLowerCase().trim();
    const fromCoords = cityCoordinates[fromCity];
    const toCoords = cityCoordinates[toCity];

    if (!fromCoords || !toCoords) return [];

    // Filtrer stasjoner som er på ruten (forenklet logikk)
    const routeStations = allChargingStations.filter(station => {
      const distFromStart = getDistance(fromCoords, { lat: station.lat, lng: station.lng });
      const distToEnd = getDistance({ lat: station.lat, lng: station.lng }, toCoords);
      const directDist = getDistance(fromCoords, toCoords);
      
      // Stasjonen er "på ruten" hvis den ikke legger til mer enn 20% ekstra distanse
      return (distFromStart + distToEnd) <= directDist * 1.2;
    });

    // Planlegg ladestopp
    while (currentDistance + usableRange < routeDistance) {
      const nextStopDistance = currentDistance + usableRange;
      
      // Finn beste stasjon rundt dette punktet
      const availableStations = routeStations.filter(station => {
        const stationDistance = (nextStopDistance / routeDistance) * getDistance(fromCoords, toCoords);
        const stationActualDist = getDistance(fromCoords, { lat: station.lat, lng: station.lng });
        return Math.abs(stationDistance - stationActualDist) < 100; // 100km radius
      });

      if (availableStations.length > 0) {
        // Velg beste stasjon basert på hastighet, tilgjengelighet og pris
        const bestStation = availableStations.reduce((best, station) => {
          const score = 
            (station.fastCharger ? 50 : 0) +
            (station.available / station.total * 30) +
            (100 - station.cost / 10); // Lavere cost = høyere score
          
          const bestScore = 
            (best.fastCharger ? 50 : 0) +
            (best.available / best.total * 30) +
            (100 - best.cost / 10);
            
          return score > bestScore ? station : best;
        });

        const stationWithAnalysis = {
          ...bestStation,
          distance: nextStopDistance,
          arrivalBattery: Math.max(10, currentBattery - (usableRange / selectedCar.range * 100)),
          departureBattery: Math.min(100, bestStation.chargeAmount + Math.max(10, currentBattery - (usableRange / selectedCar.range * 100)))
        };

        stations.push(stationWithAnalysis);
        currentDistance = nextStopDistance;
        currentBattery = stationWithAnalysis.departureBattery || 80;
      } else {
        break;
      }
    }

    return stations;
  };

  // Beregn distanse mellom to punkter (forenklet)
  const getDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Jordens radius i km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Beregn reiseanalyse
  const calculateTripAnalysis = (distance: number, stations: ChargingStation[]): TripAnalysis => {
    const weather = getWeatherData();
    const totalChargingTime = stations.reduce((sum, station) => sum + station.chargeTime, 0);
    const totalCost = stations.reduce((sum, station) => sum + station.cost, 0);
    const drivingTime = distance / 80; // Antatt 80 km/h gjennomsnitt
    const totalTime = drivingTime + (totalChargingTime / 60);
    
    const co2Saved = distance * 0.12; // 120g CO2/km spart vs bensinbil
    const efficiency = selectedCar ? (distance / selectedCar.consumption * 100) : 0;

    return {
      totalDistance: distance,
      totalTime: totalTime,
      totalCost: totalCost,
      chargingTime: totalChargingTime,
      co2Saved: co2Saved,
      efficiency: efficiency,
      weather: weather
    };
  };

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
          center: { lat: 60.472, lng: 8.4689 },
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "road",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 8,
            strokeOpacity: 0.8
          },
          suppressMarkers: true
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
    if (!map || !directionsService || !directionsRenderer || !routeData.from || !routeData.to || !selectedCar) {
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

    const request: google.maps.DirectionsRequest = {
      origin: fromCoords,
      destination: toCoords,
      travelMode: google.maps.TravelMode.DRIVING,
      region: 'no'
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);

        const route = result.routes[0];
        const distance = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000;
        
        // Optimaliser ladestasjoner basert på faktisk rute
        const optimizedStations = optimizeChargingStations(distance);
        setOptimizedStations(optimizedStations);
        
        // Beregn reiseanalyse
        const analysis = calculateTripAnalysis(distance, optimizedStations);
        setRouteAnalysis(analysis);

        const newMarkers: google.maps.Marker[] = [];

        // Start markør
        const startMarker = new google.maps.Marker({
          position: fromCoords,
          map: map,
          title: `Start: ${routeData.from}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="22" fill="#10b981" stroke="white" stroke-width="6"/>
                <text x="25" y="32" text-anchor="middle" fill="white" font-size="24" font-weight="bold">🚗</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25)
          }
        });

        newMarkers.push(startMarker);

        // Slutt markør
        const endMarker = new google.maps.Marker({
          position: toCoords,
          map: map,
          title: `Destinasjon: ${routeData.to}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="22" fill="#ef4444" stroke="white" stroke-width="6"/>
                <text x="25" y="32" text-anchor="middle" fill="white" font-size="24" font-weight="bold">🏁</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25)
          }
        });

        newMarkers.push(endMarker);

        // Optimaliserte ladestasjoner
        optimizedStations.forEach((station, index) => {
          const availabilityColor = station.available / station.total > 0.5 ? '#10b981' : 
                                   station.available > 0 ? '#f59e0b' : '#ef4444';
          
          const chargingMarker = new google.maps.Marker({
            position: { lat: station.lat, lng: station.lng },
            map: map,
            title: station.name,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22.5" cy="22.5" r="20" fill="${availabilityColor}" stroke="white" stroke-width="4"/>
                  <text x="22.5" y="18" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${index + 1}</text>
                  <text x="22.5" y="32" text-anchor="middle" fill="white" font-size="14" font-weight="bold">⚡</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(45, 45),
              anchor: new google.maps.Point(22.5, 22.5)
            }
          });

          const chargingInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 280px; font-family: system-ui;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${station.name}</h3>
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">${station.location}</p>
                
                <div style="background: #f3f4f6; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
                    <div>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Ankomst batteri</div>
                      <div style="font-weight: bold; color: #1f2937;">${station.arrivalBattery}%</div>
                    </div>
                    <div>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Avgang batteri</div>
                      <div style="font-weight: bold; color: #10b981;">${station.departureBattery}%</div>
                    </div>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                  <div style="text-align: center; padding: 8px; background: #fef3c7; border-radius: 6px;">
                    <div style="font-weight: bold; color: #92400e;">⚡ ${station.chargeAmount} kWh</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #dbeafe; border-radius: 6px;">
                    <div style="font-weight: bold; color: #1e40af;">⏱️ ${station.chargeTime} min</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #dcfce7; border-radius: 6px;">
                    <div style="font-weight: bold; color: #166534;">💰 ${station.cost} kr</div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 12px; color: #6b7280;">
                    Tilgjengelig: ${station.available}/${station.total} ladere
                  </div>
                  ${station.fastCharger ? 
                    '<div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">⚡ Hurtiglading</div>' : 
                    '<div style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Standard</div>'
                  }
                </div>
              </div>
            `
          });

          chargingMarker.addListener('click', () => {
            chargingInfoWindow.open(map, chargingMarker);
          });

          newMarkers.push(chargingMarker);
        });

        setMarkers(newMarkers);
      } else {
        console.error('Kunne ikke beregne rute:', status);
        setError('Kunne ikke beregne rute mellom byene');
      }
    });
  }, [map, directionsService, directionsRenderer, routeData, selectedCar]);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-glass-bg backdrop-blur-sm border-glass-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-electric rounded-full animate-pulse-neon"></div>
            ElRoute AI - Intelligent Ruteplanlegging
          </h3>
          {routeAnalysis && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              {Math.round(routeAnalysis.efficiency)}% effektivitet
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Smart Kart
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reiseanalyse
            </TabsTrigger>
            <TabsTrigger value="stations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ladestopp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            {loading && (
              <div className="h-96 rounded-lg border border-glass-border shadow-neon bg-background/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Initialiserer AI-ruteplanlegger...</p>
                </div>
              </div>
            )}

            {error && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon">
              <div ref={mapRef} className="w-full h-full" />
            </div>

            {/* Quick stats bar */}
            {routeAnalysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(routeAnalysis.totalDistance)} km</div>
                  <div className="text-xs text-muted-foreground">Total distanse</div>
                </div>
                <div className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border text-center">
                  <div className="text-2xl font-bold text-blue-500">{Math.round(routeAnalysis.totalTime * 60)} min</div>
                  <div className="text-xs text-muted-foreground">Total reisetid</div>
                </div>
                <div className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border text-center">
                  <div className="text-2xl font-bold text-green-500">{routeAnalysis.totalCost} kr</div>
                  <div className="text-xs text-muted-foreground">Ladekostnader</div>
                </div>
                <div className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border text-center">
                  <div className="text-2xl font-bold text-orange-500">{optimizedStations.length}</div>
                  <div className="text-xs text-muted-foreground">Ladestopp</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {routeAnalysis && (
              <>
                {/* Værpåvirkning */}
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                    Værforhold og påvirkning
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌡️</div>
                      <div className="font-bold">{routeAnalysis.weather.temperature}°C</div>
                      <div className="text-xs text-muted-foreground">Temperatur</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">💨</div>
                      <div className="font-bold">{routeAnalysis.weather.wind} m/s</div>
                      <div className="text-xs text-muted-foreground">Vind</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">☁️</div>
                      <div className="font-bold">{routeAnalysis.weather.condition}</div>
                      <div className="text-xs text-muted-foreground">Forhold</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="font-bold text-orange-600">{routeAnalysis.weather.impactOnRange > 0 ? '+' : ''}{routeAnalysis.weather.impactOnRange}%</div>
                      <div className="text-xs text-muted-foreground">Rekkevidde-påvirkning</div>
                    </div>
                  </div>
                </Card>

                {/* Miljøpåvirkning */}
                <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Car className="h-5 w-5 text-green-600" />
                    Miljøpåvirkning
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{Math.round(routeAnalysis.co2Saved)} kg</div>
                      <div className="text-sm text-muted-foreground">CO₂ spart vs bensinbil</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{Math.round(routeAnalysis.efficiency)}%</div>
                      <div className="text-sm text-muted-foreground">Energieffektivitet</div>
                    </div>
                  </div>
                </Card>

                {/* Kostnadsanalyse */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Detaljert kostnadsanalyse
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Lading totalt:</span>
                      <span className="font-semibold">{routeAnalysis.totalCost} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kostnad per km:</span>
                      <span className="font-semibold">{(routeAnalysis.totalCost / routeAnalysis.totalDistance).toFixed(2)} kr/km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spart vs bensin*:</span>
                      <span className="font-semibold text-green-600">~{Math.round(routeAnalysis.totalDistance * 2.2 - routeAnalysis.totalCost)} kr</span>
                    </div>
                    <div className="text-xs text-muted-foreground">*Basert på 22 kr/liter og 0.7L/10km forbruk</div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="stations" className="space-y-4">
            {optimizedStations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">AI-optimaliserte ladestopp</h4>
                  <Badge variant="outline" className="text-xs">
                    {optimizedStations.length} stopp planlagt
                  </Badge>
                </div>
                
                {optimizedStations.map((station, index) => (
                  <Card key={station.id} className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-electric text-primary-foreground flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-semibold text-lg">{station.name}</h5>
                            <p className="text-sm text-muted-foreground">{station.location}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                station.available / station.total > 0.5 ? 'bg-green-500' : 
                                station.available > 0 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              {station.available}/{station.total} tilgjengelig
                            </div>
                          </div>
                        </div>

                        {/* Batteri progresjon */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Batteri ved ankomst:</span>
                            <span className="font-semibold">{station.arrivalBattery}%</span>
                          </div>
                          <Progress value={station.arrivalBattery} className="h-2 mb-2" />
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Batteri ved avgang:</span>
                            <span className="font-semibold text-green-600">{station.departureBattery}%</span>
                          </div>
                          <Progress value={station.departureBattery} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-2 bg-yellow-50 rounded">
                            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                            <div className="font-semibold text-sm">{station.chargeAmount} kWh</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                            <div className="font-semibold text-sm">{station.chargeTime} min</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
                            <div className="font-semibold text-sm">{station.cost} kr</div>
                          </div>
                        </div>

                        {station.fastCharger && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Hurtiglading tilgjengelig
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Battery className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Ingen lading nødvendig!</h4>
                <p className="text-muted-foreground">
                  Din {selectedCar?.brand} {selectedCar?.model} har nok rekkevidde for hele turen med {routeData.batteryPercentage}% batteri.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}