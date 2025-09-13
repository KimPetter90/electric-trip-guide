import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Thermometer, Wind, Car, Battery, TrendingUp } from "lucide-react";
import 'leaflet/dist/leaflet.css';

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
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [activeTab, setActiveTab] = useState("map");
  const [routeLine, setRouteLine] = useState<any>(null);

  // Simuler værdata
  const getWeatherData = (): WeatherData => ({
    temperature: Math.round(Math.random() * 20 - 5),
    wind: Math.round(Math.random() * 15),
    condition: ["Overskyet", "Sol", "Regn", "Snø"][Math.floor(Math.random() * 4)],
    impactOnRange: Math.round((Math.random() - 0.5) * 20)
  });

  // Beregn distanse mellom to punkter
  const getDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Intelligent ladestasjonsoptimalisering
  const optimizeChargingStations = (routeDistance: number) => {
    if (!selectedCar) return [];

    const weather = getWeatherData();
    const trailerImpact = routeData.trailerWeight > 0 ? 15 : 0;
    const weatherImpact = weather.impactOnRange;
    const totalImpact = trailerImpact + weatherImpact;
    
    const maxRangeWithFullBattery = selectedCar.range * (1 - totalImpact / 100);
    const currentBatteryRange = maxRangeWithFullBattery * (routeData.batteryPercentage / 100);
    const safetyMargin = 50;
    let usableCurrentRange = Math.max(0, currentBatteryRange - safetyMargin);
    
    if (usableCurrentRange >= routeDistance) {
      return [];
    }

    const stations: ChargingStation[] = [];
    let currentDistance = 0;
    let currentBattery = routeData.batteryPercentage;

    const fromCity = routeData.from.toLowerCase().trim();
    const toCity = routeData.to.toLowerCase().trim();
    const fromCoords = cityCoordinates[fromCity];
    const toCoords = cityCoordinates[toCity];

    if (!fromCoords || !toCoords) return [];

    const routeStations = allChargingStations.filter(station => {
      const distFromStart = getDistance(fromCoords, { lat: station.lat, lng: station.lng });
      const distToEnd = getDistance({ lat: station.lat, lng: station.lng }, toCoords);
      const directDist = getDistance(fromCoords, toCoords);
      return (distFromStart + distToEnd) <= directDist * 1.2;
    });

    const maxDistancePerCharge = maxRangeWithFullBattery * 0.8;
    
    while (currentDistance + usableCurrentRange < routeDistance) {
      const nextStopDistance = currentDistance + usableCurrentRange;
      
      const availableStations = routeStations.filter(station => {
        const stationDistance = (nextStopDistance / routeDistance) * getDistance(fromCoords, toCoords);
        const stationActualDist = getDistance(fromCoords, { lat: station.lat, lng: station.lng });
        return Math.abs(stationDistance - stationActualDist) < 100;
      });

      if (availableStations.length > 0) {
        const bestStation = availableStations.reduce((best, station) => {
          const score = 
            (station.fastCharger ? 50 : 0) +
            (station.available / station.total * 30) +
            (100 - station.cost / 10);
          
          const bestScore = 
            (best.fastCharger ? 50 : 0) +
            (best.available / best.total * 30) +
            (100 - best.cost / 10);
            
          return score > bestScore ? station : best;
        });

        const distanceTraveled = usableCurrentRange;
        const batteryUsed = (distanceTraveled / maxRangeWithFullBattery) * 100;
        const arrivalBattery = Math.max(5, currentBattery - batteryUsed);
        
        const stationWithAnalysis = {
          ...bestStation,
          distance: nextStopDistance,
          arrivalBattery: arrivalBattery,
          departureBattery: Math.min(100, bestStation.chargeAmount + arrivalBattery)
        };

        stations.push(stationWithAnalysis);
        currentDistance = nextStopDistance;
        currentBattery = stationWithAnalysis.departureBattery || 80;
        usableCurrentRange = maxDistancePerCharge - safetyMargin;
      } else {
        break;
      }
    }

    return stations;
  };

  // Beregn reiseanalyse
  const calculateTripAnalysis = (distance: number, stations: ChargingStation[]): TripAnalysis => {
    const weather = getWeatherData();
    const totalChargingTime = stations.reduce((sum, station) => sum + station.chargeTime, 0);
    const totalCost = stations.reduce((sum, station) => sum + station.cost, 0);
    const drivingTime = distance / 80;
    const totalTime = drivingTime + (totalChargingTime / 60);
    const co2Saved = distance * 0.12;
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

  // Cleanup function
  const cleanupMap = () => {
    try {
      markers.forEach(marker => {
        if (marker && marker.setMap) {
          try {
            marker.setMap(null);
          } catch (e) {}
        } else if (marker && marker.remove) {
          try {
            marker.remove();
          } catch (e) {}
        }
      });
      setMarkers([]);
      
      if (routeLine) {
        try {
          if (routeLine.setMap) {
            routeLine.setMap(null);
          } else if (routeLine.remove) {
            routeLine.remove();
          }
        } catch (e) {}
      }
      setRouteLine(null);
    } catch (error) {}
  };

  // Initialiser kart med Leaflet
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const L = await import('leaflet');
        
        if (mapRef.current) {
          cleanupMap();
          if (map && map.remove) {
            try {
              map.remove();
            } catch (e) {}
          }
          
          const leafletMap = L.map(mapRef.current).setView([60.472, 8.4689], 6);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(leafletMap);
          
          setMap(leafletMap);
          setLoading(false);
        }
      } catch (err) {
        console.error('Feil ved kart-initialisering:', err);
        setError('Kunne ikke laste kart');
        setLoading(false);
      }
    };

    if (isVisible) {
      initializeMap();
    }
    
    return () => {
      cleanupMap();
      if (map && map.remove) {
        try {
          map.remove();
        } catch (e) {}
      }
    };
  }, [isVisible]);

  // Oppdater kart når ruteinformasjon endres
  useEffect(() => {
    const updateMapRoute = async () => {
      if (!map && !loading) {
        if (routeData.from && routeData.to && selectedCar) {
          const fromCity = routeData.from.toLowerCase().trim();
          const toCity = routeData.to.toLowerCase().trim();
          
          const fromCoords = cityCoordinates[fromCity];
          const toCoords = cityCoordinates[toCity];

          if (fromCoords && toCoords) {
            const distance = getDistance(fromCoords, toCoords);
            const optimizedStations = optimizeChargingStations(distance);
            setOptimizedStations(optimizedStations);
            
            const analysis = calculateTripAnalysis(distance, optimizedStations);
            setRouteAnalysis(analysis);
          }
        }
        return;
      }
      
      if (!map || !routeData.from || !routeData.to || !selectedCar) {
        return;
      }

      if (!mapRef.current) {
        return;
      }

      const fromCity = routeData.from.toLowerCase().trim();
      const toCity = routeData.to.toLowerCase().trim();
      
      const fromCoords = cityCoordinates[fromCity];
      const toCoords = cityCoordinates[toCity];

      if (!fromCoords || !toCoords) {
        setError(`Kunne ikke finne koordinater for ${fromCity} eller ${toCity}`);
        return;
      }

      cleanupMap();

      try {
        const L = await import('leaflet');
        
        const routePath = L.polyline([
          [fromCoords.lat, fromCoords.lng],
          [toCoords.lat, toCoords.lng]
        ], {
          color: '#3b82f6',
          opacity: 0.8,
          weight: 8
        }).addTo(map);
        
        setRouteLine(routePath);
        
        const distance = getDistance(fromCoords, toCoords);
        const optimizedStations = optimizeChargingStations(distance);
        setOptimizedStations(optimizedStations);
        
        const analysis = calculateTripAnalysis(distance, optimizedStations);
        setRouteAnalysis(analysis);

        const newMarkers: any[] = [];

        const startIcon = L.divIcon({
          html: '<div style="background: #10b981; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🚗</div>',
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const startMarker = L.marker([fromCoords.lat, fromCoords.lng], { icon: startIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 8px; min-width: 180px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${routeData.from}</h3>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Startbatteri:</strong> ${routeData.batteryPercentage}%</p>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Rekkevidde:</strong> ~${selectedCar ? Math.round(selectedCar.range * routeData.batteryPercentage / 100) : 0} km</p>
            </div>
          `);

        newMarkers.push(startMarker);

        const endIcon = L.divIcon({
          html: '<div style="background: #ef4444; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏁</div>',
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const endMarker = L.marker([toCoords.lat, toCoords.lng], { icon: endIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 8px; min-width: 180px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${routeData.to}</h3>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Total distanse:</strong> ${Math.round(distance)} km</p>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Ladestopp:</strong> ${optimizedStations.length}</p>
            </div>
          `);

        newMarkers.push(endMarker);

        optimizedStations.forEach((station, index) => {
          const availabilityColor = station.available / station.total > 0.5 ? '#10b981' : 
                                   station.available > 0 ? '#f59e0b' : '#ef4444';
          
          const chargingIcon = L.divIcon({
            html: `<div style="background: ${availabilityColor}; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${index + 1}</div>`,
            className: 'custom-marker',
            iconSize: [35, 35],
            iconAnchor: [17.5, 17.5]
          });

          const chargingMarker = L.marker([station.lat, station.lng], { icon: chargingIcon })
            .addTo(map)
            .bindPopup(`
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${station.name}</h3>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Lokasjon:</strong> ${station.location}</p>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Avstand:</strong> ${Math.round(station.distance || 0)} km fra start</p>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Ankomst batteri:</strong> ${Math.round(station.arrivalBattery || 0)}%</p>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Avreise batteri:</strong> ${Math.round(station.departureBattery || 0)}%</p>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Ladetid:</strong> ${station.chargeTime} min</p>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Kostnad:</strong> ${station.cost} kr</p>
                <p style="margin: 4px 0; color: #374151; font-size: 14px;"><strong>Tilgjengelig:</strong> ${station.available}/${station.total}</p>
                <div style="margin-top: 8px;">
                  <span style="padding: 2px 8px; background: ${availabilityColor}; color: white; border-radius: 12px; font-size: 12px;">
                    ${station.fastCharger ? 'Hurtiglader' : 'Standard'}
                  </span>
                </div>
              </div>
            `);

          newMarkers.push(chargingMarker);
        });

        setMarkers(newMarkers);
        
        if (map && mapRef.current && fromCoords && toCoords) {
          try {
            const group = L.featureGroup([...newMarkers, routePath]);
            map.fitBounds(group.getBounds().pad(0.1));
          } catch (error) {
            console.warn('Kunne ikke sette bounds:', error);
          }
        }
      } catch (error) {
        console.error('Feil ved oppdatering av kart:', error);
      }
    };

    updateMapRoute();
  }, [map, routeData, selectedCar]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">🗺️ Kart</TabsTrigger>
          <TabsTrigger value="analysis">📊 Analyse</TabsTrigger>
          <TabsTrigger value="stations">⚡ Ladestasjoner</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Route className="h-5 w-5" />
                Rute: {routeData.from} → {routeData.to}
              </h3>
              
              {routeAnalysis && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{Math.round(routeAnalysis.totalDistance)} km</span>
                  <span>{Math.round(routeAnalysis.totalTime * 60)} min</span>
                  <span>{optimizedStations.length} ladestopp</span>
                </div>
              )}
            </div>

            {error && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div 
              ref={mapRef} 
              className="w-full h-[500px] rounded-lg border bg-muted"
              style={{ minHeight: '500px' }}
            >
              {loading && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Laster kart...</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {routeAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Route className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total distanse</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.totalDistance)} km</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Total reisetid</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.totalTime)} t {Math.round((routeAnalysis.totalTime % 1) * 60)} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Ladetid</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.chargingTime)} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Ladekostnad</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.totalCost)} kr</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Temperatur</p>
                    <p className="text-2xl font-bold">{routeAnalysis.weather.temperature}°C</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Vind</p>
                    <p className="text-2xl font-bold">{routeAnalysis.weather.wind} m/s</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">CO₂ spart</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.co2Saved)} kg</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Effektivitet</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.efficiency)}%</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stations" className="space-y-4">
          <div className="grid gap-4">
            {optimizedStations.length > 0 ? (
              optimizedStations.map((station, index) => (
                <Card key={station.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={station.fastCharger ? "default" : "secondary"}>
                          Stopp {index + 1}
                        </Badge>
                        <h4 className="font-semibold">{station.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{station.location}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Ankomst:</span>
                          <p className="font-medium">{Math.round(station.arrivalBattery || 0)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avreise:</span>
                          <p className="font-medium">{Math.round(station.departureBattery || 0)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ladetid:</span>
                          <p className="font-medium">{station.chargeTime} min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kostnad:</span>
                          <p className="font-medium">{station.cost} kr</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(station.available / station.total) * 100} 
                          className="w-20 h-2" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {station.available}/{station.total} tilgjengelig
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={
                        station.available / station.total > 0.5 ? "default" : 
                        station.available > 0 ? "secondary" : "destructive"
                      }>
                        {station.fastCharger ? "⚡ Hurtiglader" : "Standard"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Battery className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Ingen lading nødvendig!</h3>
                <p className="text-muted-foreground">
                  Ditt {routeData.batteryPercentage}% batteri holder hele veien til {routeData.to}.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}