import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Thermometer, Wind, Car, Battery, TrendingUp, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

// Basis ladestasjoner (vil bli utvidet med API data)
const basicChargingStations: ChargingStation[] = [
  { id: "1", name: "Tesla Supercharger Gardermoen", location: "Oslo Lufthavn", lat: 60.1939, lng: 11.1004, chargeTime: 20, chargeAmount: 50, cost: 250, fastCharger: true, available: 8, total: 12 },
  { id: "2", name: "Ionity Jessheim", location: "Jessheim", lat: 60.1567, lng: 11.1675, chargeTime: 25, chargeAmount: 55, cost: 275, fastCharger: true, available: 4, total: 6 },
  { id: "3", name: "Circle K Lillestrøm", location: "Lillestrøm", lat: 59.9561, lng: 11.0461, chargeTime: 35, chargeAmount: 40, cost: 200, fastCharger: false, available: 2, total: 4 },
  { id: "4", name: "Ionity Bergen Flesland", location: "Bergen", lat: 60.2934, lng: 5.2181, chargeTime: 22, chargeAmount: 52, cost: 260, fastCharger: true, available: 6, total: 8 },
  { id: "5", name: "Mer Bergen Sentrum", location: "Bergen", lat: 60.3913, lng: 5.3221, chargeTime: 40, chargeAmount: 35, cost: 175, fastCharger: false, available: 3, total: 6 },
  { id: "6", name: "Ionity Lillehammer", location: "Lillehammer", lat: 61.1153, lng: 10.4662, chargeTime: 24, chargeAmount: 54, cost: 270, fastCharger: true, available: 5, total: 8 },
  { id: "7", name: "Tesla Supercharger Hønefoss", location: "Hønefoss", lat: 60.1681, lng: 10.2597, chargeTime: 21, chargeAmount: 51, cost: 255, fastCharger: true, available: 7, total: 10 },
  { id: "8", name: "Eviny Fagernes", location: "Fagernes", lat: 61.0067, lng: 9.2881, chargeTime: 30, chargeAmount: 45, cost: 225, fastCharger: true, available: 2, total: 4 },
  { id: "9", name: "Mer Gol", location: "Gol", lat: 60.6856, lng: 9.0072, chargeTime: 35, chargeAmount: 42, cost: 210, fastCharger: false, available: 1, total: 3 },
  { id: "10", name: "Tesla Supercharger Trondheim", location: "Trondheim", lat: 63.4305, lng: 10.3951, chargeTime: 19, chargeAmount: 56, cost: 280, fastCharger: true, available: 12, total: 16 },
  { id: "11", name: "Ionity Oppdal", location: "Oppdal", lat: 62.5948, lng: 9.6915, chargeTime: 26, chargeAmount: 48, cost: 240, fastCharger: true, available: 3, total: 6 },
  { id: "12", name: "Eviny Stavanger", location: "Stavanger", lat: 58.9700, lng: 5.7331, chargeTime: 28, chargeAmount: 46, cost: 230, fastCharger: true, available: 4, total: 8 },
  { id: "13", name: "Ionity Ålesund", location: "Ålesund", lat: 62.4722, lng: 6.1549, chargeTime: 25, chargeAmount: 50, cost: 250, fastCharger: true, available: 5, total: 6 },
  { id: "14", name: "Circle K Molde", location: "Molde", lat: 62.7372, lng: 7.1607, chargeTime: 33, chargeAmount: 38, cost: 190, fastCharger: false, available: 2, total: 4 }
];

// Funksjon for å hente norske ladestasjoner (fallback til statisk data)
const fetchNorwegianChargingStations = async (): Promise<ChargingStation[]> => {
  try {
    console.log('🔍 Laster utvidet ladestasjonsdatabase...');
    
    // For nå bruker vi en utvidet statisk database med mange flere stasjoner
    const extendedStations: ChargingStation[] = [
      // Oslo-området
      { id: "ocm_1001", name: "Circle K Ryen", location: "Oslo", lat: 59.8847, lng: 10.8061, chargeTime: 35, chargeAmount: 40, cost: 200, fastCharger: false, available: 3, total: 4 },
      { id: "ocm_1002", name: "Tesla Supercharger Vinterbro", location: "Ås", lat: 59.7465, lng: 10.8156, chargeTime: 18, chargeAmount: 58, cost: 290, fastCharger: true, available: 6, total: 8 },
      { id: "ocm_1003", name: "Ionity Rygge", location: "Moss", lat: 59.3789, lng: 10.7856, chargeTime: 22, chargeAmount: 54, cost: 270, fastCharger: true, available: 4, total: 6 },
      { id: "ocm_1004", name: "Mer Fornebu", location: "Bærum", lat: 59.8956, lng: 10.6161, chargeTime: 40, chargeAmount: 35, cost: 175, fastCharger: false, available: 2, total: 4 },
      
      // På ruten Oslo-Ålesund (E6/E136)
      { id: "ocm_1005", name: "Circle K Harestua", location: "Lunner", lat: 60.3167, lng: 10.5333, chargeTime: 30, chargeAmount: 42, cost: 210, fastCharger: false, available: 2, total: 3 },
      { id: "ocm_1006", name: "Tesla Supercharger Mjøsbrua", location: "Moelv", lat: 60.9344, lng: 10.6911, chargeTime: 20, chargeAmount: 52, cost: 260, fastCharger: true, available: 5, total: 8 },
      { id: "ocm_1007", name: "Eviny Dombås", location: "Dovre", lat: 62.0744, lng: 9.1200, chargeTime: 28, chargeAmount: 48, cost: 240, fastCharger: true, available: 3, total: 5 },
      { id: "ocm_1008", name: "Circle K Otta", location: "Sel", lat: 61.7711, lng: 9.5278, chargeTime: 32, chargeAmount: 38, cost: 190, fastCharger: false, available: 1, total: 2 },
      { id: "ocm_1009", name: "Ionity Lom", location: "Lom", lat: 61.8367, lng: 8.5678, chargeTime: 25, chargeAmount: 50, cost: 250, fastCharger: true, available: 4, total: 6 },
      { id: "ocm_1010", name: "Tesla Supercharger Stryn", location: "Stryn", lat: 61.9111, lng: 6.7189, chargeTime: 21, chargeAmount: 54, cost: 270, fastCharger: true, available: 6, total: 10 },
      
      // Nær start (Ålesund-området)
      { id: "ocm_1011", name: "Circle K Moa", location: "Ålesund", lat: 62.4167, lng: 6.2833, chargeTime: 35, chargeAmount: 40, cost: 200, fastCharger: false, available: 2, total: 3 },
      { id: "ocm_1012", name: "Mer Langevåg", location: "Giske", lat: 62.4500, lng: 6.0833, chargeTime: 40, chargeAmount: 35, cost: 175, fastCharger: false, available: 1, total: 2 },
      { id: "ocm_1013", name: "Eviny Volda", location: "Volda", lat: 62.1489, lng: 6.0711, chargeTime: 30, chargeAmount: 45, cost: 225, fastCharger: true, available: 3, total: 4 },
      { id: "ocm_1014", name: "Tesla Supercharger Fosnavåg", location: "Herøy", lat: 62.3233, lng: 5.7500, chargeTime: 19, chargeAmount: 56, cost: 280, fastCharger: true, available: 8, total: 12 },
      
      // Tidlige stopp langs ruten (50-150km fra Ålesund)
      { id: "ocm_1015", name: "Circle K Sjøholt", location: "Ørsta", lat: 62.1944, lng: 6.1389, chargeTime: 33, chargeAmount: 38, cost: 190, fastCharger: false, available: 2, total: 3 },
      { id: "ocm_1016", name: "Ionity Hellesylt", location: "Stranda", lat: 62.0833, lng: 7.1167, chargeTime: 24, chargeAmount: 52, cost: 260, fastCharger: true, available: 4, total: 6 },
      { id: "ocm_1017", name: "Mer Hornindal", location: "Hornindal", lat: 61.9667, lng: 6.5333, chargeTime: 38, chargeAmount: 36, cost: 180, fastCharger: false, available: 1, total: 2 },
      { id: "ocm_1018", name: "Eviny Loen", location: "Stryn", lat: 61.8667, lng: 6.8500, chargeTime: 26, chargeAmount: 46, cost: 230, fastCharger: true, available: 3, total: 5 },
      
      // Flere alternativer rundt Lillehammer (300-400km)
      { id: "ocm_1019", name: "Circle K Hamar", location: "Hamar", lat: 60.7945, lng: 11.0680, chargeTime: 32, chargeAmount: 40, cost: 200, fastCharger: false, available: 2, total: 4 },
      { id: "ocm_1020", name: "Tesla Supercharger Elverum", location: "Elverum", lat: 60.8811, lng: 11.5644, chargeTime: 20, chargeAmount: 54, cost: 270, fastCharger: true, available: 7, total: 10 },
      { id: "ocm_1021", name: "Ionity Vinstra", location: "Nord-Fron", lat: 61.5356, lng: 9.9333, chargeTime: 23, chargeAmount: 53, cost: 265, fastCharger: true, available: 5, total: 8 }
    ];
    
    console.log(`✅ Lastet ${extendedStations.length} ekstra ladestasjoner`);
    return extendedStations;
    
  } catch (error) {
    console.error('❌ Feil ved henting av ladestasjoner:', error);
    return [];
  }
};

interface RouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel | null;
}

export default function RouteMap({ isVisible, routeData, selectedCar }: RouteMapProps) {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [activeTab, setActiveTab] = useState("analysis");
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [allChargingStations, setAllChargingStations] = useState<ChargingStation[]>(basicChargingStations);

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

  // Finn stasjoner som ligger nær den faktiske ruten
  const findStationsNearRoute = (routeGeometry: any) => {
    if (!routeGeometry || !routeGeometry.coordinates) {
      console.log('Ingen rute-geometri tilgjengelig');
      return [];
    }

    const routeCoords = routeGeometry.coordinates;
    const maxDistanceFromRoute = 25; // Maksimum 25 km fra ruten
    
    return allChargingStations.filter(station => {
      // Finn nærmeste punkt på ruten til stasjonen
      let minDistance = Infinity;
      let routeDistance = 0;
      let closestSegmentIndex = 0;
      
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const routePoint = { lat: routeCoords[i][1], lng: routeCoords[i][0] };
        const distanceToStation = getDistance(routePoint, { lat: station.lat, lng: station.lng });
        
        if (distanceToStation < minDistance) {
          minDistance = distanceToStation;
          closestSegmentIndex = i;
        }
      }
      
      // Beregn avstand langs ruten til dette punktet
      routeDistance = 0;
      for (let j = 0; j < closestSegmentIndex; j++) {
        const segmentDistance = getDistance(
          { lat: routeCoords[j][1], lng: routeCoords[j][0] },
          { lat: routeCoords[j + 1][1], lng: routeCoords[j + 1][0] }
        );
        routeDistance += segmentDistance;
      }
      
      // Legg til avstand fra ruten og avstand langs ruten
      (station as any).distanceFromRoute = minDistance;
      (station as any).routeDistance = routeDistance;
      
      return minDistance <= maxDistanceFromRoute;
    }).sort((a, b) => (a as any).routeDistance - (b as any).routeDistance);
  };

  // Intelligent ladestasjonsoptimalisering med obligatoriske stopp
  const optimizeChargingStations = (routeDistance: number, routeGeometry: any) => {
    if (!selectedCar) return [];

    const currentBattery = routeData.batteryPercentage;
    const maxRange = selectedCar.range;
    
    // Hengervekt-påvirkning
    const trailerImpact = routeData.trailerWeight / 1000 * 0.25; // 25% reduksjon per tonn
    
    const actualRange = maxRange * (1 - trailerImpact);
    const currentRange = (actualRange * currentBattery / 100);
    
    console.log('=== LADEBEREGNING ===');
    console.log('Nåværende batteri:', currentBattery + '%');
    console.log('Maks rekkevidde:', maxRange, 'km');
    console.log('Hengervekt:', routeData.trailerWeight, 'kg');
    console.log('Hengervekt-påvirkning:', (trailerImpact * 100).toFixed(1) + '%');
    console.log('Hengervekt-påvirkning:', (trailerImpact * 100).toFixed(1) + '%');
    console.log('Faktisk rekkevidde (etter henger/vær):', actualRange.toFixed(1), 'km'); 
    console.log('Nåværende rekkevidde:', currentRange.toFixed(1), 'km');
    console.log('Rute-avstand:', routeDistance, 'km');

    // Finn stasjoner som ligger langs ruten
    const stationsNearRoute = findStationsNearRoute(routeGeometry);
    console.log('Stasjoner langs ruten:', stationsNearRoute.length);

    // Realistisk sjekk: Hvis batteriet holder hele veien, ikke vis noen markører
    if (currentRange >= routeDistance) {
      console.log('✅ Batteriet holder hele veien - ingen lademarkører nødvendig');
      return [];
    }

    console.log('⚠️ Trenger lading! Mangler:', (routeDistance - currentRange).toFixed(1), 'km');
    console.log('💡 Hengervekt reduserte rekkevidde med:', ((maxRange - actualRange)).toFixed(1), 'km');

    if (stationsNearRoute.length === 0) {
      console.log('❌ Ingen stasjoner funnet langs ruten');
      return [];
    }

    // Forenklet logikk: Finn første stasjon som vi kan nå og som gir oss nok rekkevidde
    const requiredStations: ChargingStation[] = [];
    let remainingDistance = routeDistance;
    let currentBattery_remaining = currentBattery;
    let distanceCovered = 0;

    const sortedStations = stationsNearRoute
      .filter(station => station.available > 0) // Bare tilgjengelige stasjoner
      .sort((a, b) => (a as any).routeDistance - (b as any).routeDistance); // Sorter etter avstand langs ruten

    console.log('Sorterte stasjoner:', sortedStations.map(s => `${s.name} (${((s as any).routeDistance).toFixed(1)}km fra rute-start, ${s.fastCharger ? 'Hurtig' : 'Vanlig'}, ${s.available}/${s.total} ledig, ${s.chargeAmount}kWh)`));

    // Simuler reise og finn hvor batteriet blir lavt (ca 10%)
    let batteryAtDistance = [];
    let tempBattery = currentBattery;
    let tempDistance = 0;
    const lowBatteryThreshold = 15; // Anbefal lading når batteriet kommer under 15%
    
    // Beregn batterinivå langs hele ruten
    for (let i = 0; i < stationsNearRoute.length; i++) {
      const station = stationsNearRoute[i];
      const stationDistance = (station as any).routeDistance;
      const distanceFromLast = stationDistance - tempDistance;
      
      // Beregn batteribruk til denne stasjonen
      const batteryUsed = (distanceFromLast / actualRange) * 100;
      tempBattery -= batteryUsed;
      
      batteryAtDistance.push({
        station,
        distance: stationDistance,
        batteryLevel: tempBattery
      });
      
      tempDistance = stationDistance;
    }
    
    // Finn første stasjon hvor batteriet er under terskelen
    const needsChargingAt = batteryAtDistance.find(item => item.batteryLevel <= lowBatteryThreshold);
    
    if (!needsChargingAt) {
      // Sjekk om batteriet holder hele veien
      const finalBatteryUsed = (routeDistance / actualRange) * 100;
      const finalBattery = currentBattery - finalBatteryUsed;
      
      if (finalBattery > lowBatteryThreshold) {
        console.log(`✅ Batteriet holder hele veien (${finalBattery.toFixed(1)}% igjen ved ankomst)`);
        return [];
      }
    }
    // Hvis vi trenger lading, returner kun den stasjonen hvor batteriet blir lavt
    if (needsChargingAt) {
      const station = needsChargingAt.station;
      const arrivalBattery = needsChargingAt.batteryLevel;
      const departureBattery = Math.min(80, arrivalBattery + station.chargeAmount);
      
      console.log(`📍 Lading nødvendig ved: ${station.name} på ${needsChargingAt.distance.toFixed(1)}km`);
      console.log(`   Batterinivå ved ankomst: ${arrivalBattery.toFixed(1)}%`);
      console.log(`   Batterinivå etter lading: ${departureBattery.toFixed(1)}%`);
      
      return [{
        ...station,
        distance: needsChargingAt.distance,
        arrivalBattery,
        departureBattery,
        isRequired: true
      } as any];
    }
    
    console.log('🏁 RESULTAT: Batteriet holder hele veien eller ingen passende stasjon funnet');
    return [];
  };

  // Beregn vær-påvirkning
  const calculateWeatherImpact = (): WeatherData => {
    return {
      temperature: Math.round(Math.random() * 20 - 5), // -5 til 15°C
      wind: Math.round(Math.random() * 15), // 0-15 m/s
      condition: ['Sol', 'Skyet', 'Regn', 'Snø'][Math.floor(Math.random() * 4)],
      impactOnRange: Math.round(Math.random() * 15) // 0-15% påvirkning
    };
  };

  // Beregn reiseanalyse
  const calculateTripAnalysis = (distance: number, stations: ChargingStation[]): TripAnalysis => {
    try {
      const totalTime = distance / 80; // Antatt snittfart 80 km/t
      const chargingTime = stations.reduce((total, station) => total + station.chargeTime, 0) / 60;
      const totalCost = stations.reduce((total, station) => total + station.cost, 0);
      const co2Saved = distance * 0.12; // 120g CO2/km for bensinbil
      const efficiency = selectedCar ? (selectedCar.range / selectedCar.batteryCapacity) * 100 / distance : 85;
      
      const analysis = {
        totalDistance: distance || 0,
        totalTime: (totalTime + chargingTime) || 0,
        totalCost: totalCost || 0,
        chargingTime: (chargingTime * 60) || 0,
        co2Saved: co2Saved || 0,
        efficiency: Math.min(efficiency || 85, 100),
        weather: getWeatherData()
      };
      
      console.log('✅ Trip analysis calculated:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ Error calculating trip analysis:', error);
      // Return default analysis if calculation fails
      return {
        totalDistance: 0,
        totalTime: 0,
        totalCost: 0,
        chargingTime: 0,
        co2Saved: 0,
        efficiency: 85,
        weather: getWeatherData()
      };
    }
  };

  // Rydd opp kart
  const cleanupMap = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    
    if (map.current) {
      // Fjern alle rute-lag
      const layers = ['route-center', 'route', 'route-outline'];
      layers.forEach(layerId => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
      });
      
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
    }
  };

  // Hent Mapbox token
  const fetchMapboxToken = async () => {
    try {
      // Prøv først direkte fetch
      const response = await fetch('https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/mapbox-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTQ0MDgsImV4cCI6MjA3MzM3MDQwOH0.KdDS_tT7LV7HuXN8Nw3dxUU3YRGobsJrkE2esDxgJH8`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Mapbox token response:', data);
      
      if (data.token) {
        setMapboxToken(data.token);
        return data.token;
      } else {
        throw new Error(data.error || 'Ingen token i response');
      }
    } catch (error) {
      console.error('Feil ved henting av Mapbox token:', error);
      
      // Fallback: Hardkoded token for testing (ikke anbefalt for produksjon)
      console.log('Prøver fallback token...');
      const fallbackToken = 'pk.eyJ1Ijoia2ltcGV0dGVyIiwiYSI6ImNtZmlxeG4zaTBubDQyaXNmNjhxZDB5eXcifQ.pWlwkZgophFQSQbG4xKwWw';
      setMapboxToken(fallbackToken);
      return fallbackToken;
    }
  };

  // Initialiser kart
  const initializeMap = async () => {
    try {
      console.log('Starter kart-initialisering...');
      setLoading(true);
      setError(null);
      
      if (!mapContainer.current) {
        throw new Error('Map container ikke tilgjengelig');
      }

      const token = await fetchMapboxToken();
      if (!token) return;

      mapboxgl.accessToken = token;
      
      console.log('Oppretter nytt Mapbox-kart...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [8.4689, 60.472],
        zoom: 5
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );
      
      console.log('Mapbox-kart opprettet suksessfullt');
      setLoading(false);
      
    } catch (err) {
      console.error('Feil ved kart-initialisering:', err);
      setError('Kunne ikke laste kart. Prøv å oppdatere siden.');
      setLoading(false);
    }
  };

  // Oppdater rute på kart med Mapbox Directions API
  const updateMapRoute = async () => {
    console.log('updateMapRoute startet');
    
    if (!map.current || !routeData.from || !routeData.to || !selectedCar || !mapboxToken) {
      console.log('Mangler data for rute-oppdatering', { 
        map: !!map.current, 
        from: routeData.from, 
        to: routeData.to, 
        car: !!selectedCar,
        token: !!mapboxToken
      });
      return;
    }

    const fromCity = routeData.from.toLowerCase().trim();
    const toCity = routeData.to.toLowerCase().trim();
    
    console.log('Søker etter koordinater for:', { fromCity, toCity });
    
    const fromCoords = cityCoordinates[fromCity];
    const toCoords = cityCoordinates[toCity];

    if (!fromCoords || !toCoords) {
      console.error('Koordinater ikke funnet for byer');
      setError(`Kunne ikke finne koordinater for ${fromCity} eller ${toCity}`);
      return;
    }

    console.log('Koordinater funnet:', { fromCoords, toCoords });

    cleanupMap();

    try {
      console.log('Henter rute fra Mapbox Directions API...');
      
      // Bruk høyere oppløsning og flere parametere for mer nøyaktig rute
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?geometries=geojson&overview=full&steps=true&continue_straight=true&annotations=duration,distance,speed&access_token=${mapboxToken}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // Konverter til km
        
        console.log('Rute mottatt fra Mapbox:', { distance, duration: route.duration });
        
        // Legg til rute på kartet med forbedret styling
        map.current!.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });

        // Legg til en outline (bakgrunn) for ruten
        map.current!.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 10,
            'line-opacity': 0.8
          }
        });

        // Legg til hovedruten oppå
        map.current!.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 6,
            'line-opacity': 1
          }
        });

        // Legg til en lysere linje i midten for ekstra tydelighet
        map.current!.addLayer({
          id: 'route-center',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#60a5fa',
            'line-width': 2,
            'line-opacity': 0.8
          }
        });

        // Legg til start- og sluttpunkt
        const newMarkers: mapboxgl.Marker[] = [];
        
        const startMarker = new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat([fromCoords.lng, fromCoords.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h4>Start: ${routeData.from}</h4>`))
          .addTo(map.current!);
        
        const endMarker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([toCoords.lng, toCoords.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h4>Mål: ${routeData.to}</h4>`))
          .addTo(map.current!);
        
        newMarkers.push(startMarker, endMarker);
        
        console.log('Optimaliserer ladestasjoner...');
        const optimizedStations = optimizeChargingStations(distance, route.geometry);
        setOptimizedStations(optimizedStations);
        
        // Sjekk om brukeren trenger å lade hjemme
        if (optimizedStations.length > 0 && (optimizedStations[0] as any).needsHomeCharging) {
          toast({
            title: "⚡ Lade hjemme anbefales",
            description: `Med ${routeData.batteryPercentage}% batteri kan du ikke nå første ladestasjon. Vi anbefaler å lade til minst 80% hjemme før avreise.`,
            variant: "destructive",
          });
        }
        
        console.log('Beregner analyse...');
        const analysis = calculateTripAnalysis(distance, optimizedStations);
        if (analysis && typeof analysis === 'object' && analysis.totalDistance !== undefined) {
          setRouteAnalysis(analysis);
          console.log('✅ Route analysis set successfully:', analysis);
        } else {
          console.error('❌ Invalid analysis object:', analysis);
        }

        console.log('Legger til markører for', optimizedStations.length, 'ladestasjoner');
        console.log('Optimized stations data:', optimizedStations.map(s => ({ name: s.name, isRequired: (s as any).isRequired })));
        
        // Fjern eksisterende markører først
        markers.forEach(marker => marker.remove());
        const chargingMarkers: mapboxgl.Marker[] = [];
        
        // Legg til ladestasjonsmarkører med tydelig skille mellom obligatoriske og valgfrie
        optimizedStations.forEach((station, index) => {
          const isRequired = (station as any).isRequired;
          const arrivalBattery = (station as any).arrivalBattery || 50;
          
          const el = document.createElement('div');
          el.className = 'charging-marker';
          
          if (isRequired) {
            // Obligatorisk ladestasjon - rød/orange
            el.style.backgroundColor = arrivalBattery < 20 ? '#ef4444' : '#f59e0b';
            el.style.border = '3px solid #dc2626';
            el.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)';
          } else {
            // Valgfri ladestasjon - grønn/blå
            el.style.backgroundColor = '#10b981';
            el.style.border = '2px solid #059669';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          }
          
          el.style.width = isRequired ? '35px' : '28px';
          el.style.height = isRequired ? '35px' : '28px';
          el.style.borderRadius = '50%';
          el.style.color = 'white';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = isRequired ? '16px' : '12px';
          el.style.fontWeight = 'bold';
          el.style.position = 'relative';
          
          // Legg til ikon for obligatoriske stasjoner
          if (isRequired) {
            el.innerHTML = `<span style="position: absolute; top: -5px; right: -5px; background: #dc2626; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; font-size: 10px;">!</span>${index + 1}`;
          } else {
            el.textContent = (index + 1).toString();
          }

          const marker = new mapboxgl.Marker(el)
            .setLngLat([station.lng, station.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-3 max-w-xs">
                <div class="flex items-center gap-2 mb-2">
                  <h4 class="font-semibold text-sm">${station.name}</h4>
                  ${isRequired ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded">OBLIGATORISK</span>' : '<span class="bg-green-500 text-white text-xs px-2 py-1 rounded">VALGFRI</span>'}
                </div>
                <p class="text-sm text-gray-600 mb-2">${station.location}</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>Avstand:</strong> ${Math.round(station.distance || 0)} km</div>
                  <div><strong>Tilgjengelig:</strong> ${station.available}/${station.total}</div>
                  <div><strong>Ankomst batteri:</strong> ${Math.round(arrivalBattery)}%</div>
                  <div><strong>Ladetid:</strong> ${station.chargeTime} min</div>
                  <div><strong>Lading:</strong> ${station.chargeAmount} kWh</div>
                  <div><strong>Kostnad:</strong> ${station.cost} kr</div>
                </div>
                ${isRequired ? '<p class="text-xs text-red-600 mt-2 font-medium">⚠️ Du må lade her for å nå målet</p>' : ''}
              </div>
            `))
            .addTo(map.current!);
          
          chargingMarkers.push(marker);
        });
        
        // Kombiner alle markører
        const allNewMarkers = [...newMarkers, ...chargingMarkers];
        setMarkers(allNewMarkers);
        console.log('Lagt til', chargingMarkers.length, 'ladestasjonsmarkører på kartet');
        
        // Tilpass visningen til ruten
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([fromCoords.lng, fromCoords.lat]);
        bounds.extend([toCoords.lng, toCoords.lat]);
        
        optimizedStations.forEach(station => {
          bounds.extend([station.lng, station.lat]);
        });
        
        map.current!.fitBounds(bounds, { padding: 50 });

        console.log('Rute-oppdatering fullført suksessfullt!');
        
      } else {
        throw new Error('Ingen rute funnet');
      }

    } catch (error) {
      console.error('Feil ved rute-oppdatering:', error);
      setError('Kunne ikke beregne rute');
    }
  };

  // Effekt for initialisering av kart
  useEffect(() => {
    if (isVisible) {
      console.log('Komponenten er synlig, initialiserer kart...');
      const timer = setTimeout(() => {
        initializeMap();
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      cleanupMap();
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isVisible]);

  // Effekt for lasting av ladestasjoner
  useEffect(() => {
    const loadChargingStations = async () => {
      const norwegianStations = await fetchNorwegianChargingStations();
      if (norwegianStations.length > 0) {
        // Kombiner basis stasjoner med API data
        const combinedStations = [...basicChargingStations, ...norwegianStations];
        setAllChargingStations(combinedStations);
        console.log(`🎯 Totalt ${combinedStations.length} ladestasjoner tilgjengelig`);
      }
    };
    
    loadChargingStations();
  }, []);

  // Effekt for rute-oppdatering
  useEffect(() => {
    console.log('RouteData endret:', routeData);
    console.log('SelectedCar:', selectedCar?.model);
    console.log('MapboxToken:', !!mapboxToken);
    console.log('Map ready:', !!map.current);
    
    if (map.current && routeData.from && routeData.to && selectedCar && mapboxToken) {
      console.log('🔄 Oppdaterer rute på grunn av endring i data...');
      // Eksplisitt cleanup før oppdatering
      cleanupMap();
      setOptimizedStations([]);
      setRouteAnalysis(null);
      
      // Kort delay for å sikre cleanup er ferdig
      setTimeout(() => {
        updateMapRoute();
      }, 100);
    }
  }, [routeData.from, routeData.to, routeData.batteryPercentage, routeData.trailerWeight, selectedCar?.id, mapboxToken]);

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Ruteplanlegging</h3>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Kart-container */}
      <div className="space-y-4">
        {loading && (
          <Card className="p-8 text-center">
            <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Laster kart...</p>
          </Card>
        )}
        
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border-2 border-primary shadow-lg relative"
          style={{ 
            minHeight: '400px',
            maxHeight: '600px'
          }}
        />
        
        {/* Debug info */}
        <Card className="p-4 bg-blue-50">
          <p className="text-sm">
            <strong>Debug:</strong> 
            Kart lastet: {!loading ? '✅' : '❌'}, 
            Markører: {markers.length}, 
            Ladestasjoner: {optimizedStations.length},
            Token: {mapboxToken ? '✅' : '❌'}
          </p>
        </Card>
      </div>

      {/* Analyse og ladestasjoner - FORENKLET */}
      <div className="w-full mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🔧 RUTEANALYSE (Forenklet versjon)
          </h2>
          
          {/* Debug info */}
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
            <p><strong>Status:</strong></p>
            <p>• Komponent synlig: {isVisible ? '✅' : '❌'}</p>
            <p>• Valgt bil: {selectedCar ? `✅ ${selectedCar.brand} ${selectedCar.model}` : '❌'}</p>
            <p>• Rute: {routeData.from} → {routeData.to}</p>
            <p>• RouteAnalysis data: {routeAnalysis ? '✅ Lastet' : '❌ Ikke lastet'}</p>
            <p>• Ladestasjoner: {optimizedStations.length} funnet</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="analysis">📊 Analyse</TabsTrigger>
              <TabsTrigger value="stations">⚡ Ladestasjoner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Rutedata</h3>
                {routeAnalysis ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Distanse</p>
                      <p className="text-xl font-bold text-blue-600">{Math.round(routeAnalysis.totalDistance)} km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tid</p>
                      <p className="text-xl font-bold text-green-600">{Math.round(routeAnalysis.totalTime)} timer</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Kostnad</p>
                      <p className="text-xl font-bold text-orange-600">{Math.round(routeAnalysis.totalCost)} kr</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Effektivitet</p>
                      <p className="text-xl font-bold text-purple-600">{Math.round(routeAnalysis.efficiency)}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">Venter på ruteberegning...</p>
                    <p className="text-sm text-gray-400 mt-2">Planlegg en rute for å se analysedata</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stations" className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Ladestasjoner ({optimizedStations.length})</h3>
                {optimizedStations.length > 0 ? (
                  <div className="space-y-3">
                    {optimizedStations.map((station, index) => (
                      <div key={station.id} className="bg-white p-4 rounded border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-lg">{station.name}</p>
                            <p className="text-sm text-gray-600">{station.location}</p>
                            <p className="text-sm font-medium mt-1">
                              {(station as any).isRequired ? 
                                <span className="text-red-600">⚠️ Obligatorisk stopp</span> : 
                                <span className="text-green-600">✅ Valgfritt stopp</span>
                              }
                            </p>
                            {(station as any).arrivalBattery && (
                              <p className="text-sm text-blue-600 mt-1">
                                Ankomst batteri: {Math.round((station as any).arrivalBattery)}%
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{station.chargeTime} min</p>
                            <p className="text-sm text-gray-600">{station.cost} kr</p>
                            <p className="text-xs text-gray-500">{station.available}/{station.total} ledige</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">Ingen ladestasjoner nødvendig</p>
                    <p className="text-sm text-gray-400 mt-2">Batteriet holder hele veien eller rute ikke beregnet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
         </div>
      </div>
    </div>
  );
}