import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Thermometer, Wind, Car, Battery, TrendingUp, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
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
  windSpeed: number;
  windDirection: number;
  humidity: number;
  weatherCondition: string;
  visibility: number;
}

interface RouteWeatherData {
  startWeather: WeatherData;
  endWeather: WeatherData;
  averageConditions: {
    temperature: number;
    windSpeed: number;
    humidity: number;
  };
  rangeFactor: number;
}

interface TripAnalysis {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  chargingTime: number;
  co2Saved: number;
  efficiency: number;
  weather: RouteWeatherData | null;
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
      { id: "ocm_1021", name: "Ionity Vinstra", location: "Nord-Fron", lat: 61.5356, lng: 9.9333, chargeTime: 23, chargeAmount: 53, cost: 265, fastCharger: true, available: 5, total: 8 },
      
      // Sørlandet
      { id: "ocm_2001", name: "Ionity Kristiansand", location: "Kristiansand", lat: 58.1599, lng: 8.0182, chargeTime: 24, chargeAmount: 52, cost: 260, fastCharger: true, available: 5, total: 8 },
      { id: "ocm_2002", name: "Tesla Supercharger Mandal", location: "Mandal", lat: 58.0289, lng: 7.4611, chargeTime: 20, chargeAmount: 55, cost: 275, fastCharger: true, available: 4, total: 6 },
      { id: "ocm_2003", name: "Circle K Arendal", location: "Arendal", lat: 58.4611, lng: 8.7722, chargeTime: 30, chargeAmount: 42, cost: 210, fastCharger: false, available: 2, total: 3 },
      { id: "ocm_2004", name: "Mer Grimstad", location: "Grimstad", lat: 58.3405, lng: 8.5936, chargeTime: 35, chargeAmount: 38, cost: 190, fastCharger: false, available: 1, total: 2 },
      { id: "ocm_2005", name: "Eviny Lillesand", location: "Lillesand", lat: 58.2544, lng: 8.3739, chargeTime: 40, chargeAmount: 35, cost: 175, fastCharger: false, available: 2, total: 3 },
      
      // Vestlandet
      { id: "ocm_3001", name: "Ionity Bergen Flesland", location: "Bergen", lat: 60.2934, lng: 5.2181, chargeTime: 22, chargeAmount: 52, cost: 260, fastCharger: true, available: 6, total: 8 },
      { id: "ocm_3002", name: "Tesla Supercharger Stavanger", location: "Stavanger", lat: 58.9700, lng: 5.7331, chargeTime: 19, chargeAmount: 56, cost: 280, fastCharger: true, available: 7, total: 10 },
      { id: "ocm_3003", name: "Circle K Haugesund", location: "Haugesund", lat: 59.4138, lng: 5.2681, chargeTime: 30, chargeAmount: 42, cost: 210, fastCharger: false, available: 3, total: 4 },
      { id: "ocm_3004", name: "Mer Odda", location: "Odda", lat: 60.0667, lng: 6.5444, chargeTime: 35, chargeAmount: 40, cost: 200, fastCharger: false, available: 2, total: 3 },
      
      // Midt-Norge
      { id: "ocm_4001", name: "Tesla Supercharger Trondheim", location: "Trondheim", lat: 63.4305, lng: 10.3951, chargeTime: 18, chargeAmount: 58, cost: 290, fastCharger: true, available: 8, total: 12 },
      { id: "ocm_4002", name: "Circle K Steinkjer", location: "Steinkjer", lat: 64.0186, lng: 11.4952, chargeTime: 32, chargeAmount: 40, cost: 200, fastCharger: false, available: 2, total: 3 },
      { id: "ocm_4003", name: "Ionity Røros", location: "Røros", lat: 62.5744, lng: 11.3914, chargeTime: 25, chargeAmount: 50, cost: 250, fastCharger: true, available: 4, total: 6 }
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
  const lastRouteDataRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [activeTab, setActiveTab] = useState("analysis");
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [allChargingStations, setAllChargingStations] = useState<ChargingStation[]>(basicChargingStations);
  const [weatherData, setWeatherData] = useState<RouteWeatherData | null>(null);

  // Hent værdata fra Supabase edge function
  const fetchWeatherData = async (startCoords: { lat: number; lng: number }, endCoords: { lat: number; lng: number }, travelDate?: Date) => {
    try {
      console.log('🌤️ Henter værdata for ruten...', travelDate ? `for dato: ${travelDate.toLocaleDateString()}` : 'for i dag');
      
      const { data, error } = await supabase.functions.invoke('weather-service', {
        body: {
          startLat: startCoords.lat,
          startLng: startCoords.lng,
          endLat: endCoords.lat,
          endLng: endCoords.lng,
          travelDate: travelDate?.toISOString()
        }
      });

      if (error) {
        console.error('Feil ved henting av værdata:', error);
        return null;
      }

      console.log('✅ Værdata hentet:', data);
      return data as RouteWeatherData;
    } catch (error) {
      console.error('Nettverksfeil ved henting av værdata:', error);
      return null;
    }
  };

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

  // Finn stasjoner som ligger nær den faktiske ruten (BEGRENSET)
  const findStationsNearRoute = (routeGeometry: any) => {
    if (!routeGeometry || !routeGeometry.coordinates) {
      console.log('❌ Ingen rute-geometri tilgjengelig');
      return [];
    }

    const routeCoords = routeGeometry.coordinates;
    const maxDistanceFromRoute = 10; // KUN 10 km fra ruten
    
    const stationsAlongRoute = allChargingStations.filter(station => {
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
    });

    // Sorter etter avstand langs ruten og ta kun de 5 første
    const sortedStations = stationsAlongRoute
      .sort((a, b) => (a as any).routeDistance - (b as any).routeDistance)
      .slice(0, 5); // MAKS 5 stasjoner totalt

    console.log(`📍 Fant ${sortedStations.length} stasjoner langs ruten (maks 5, innen ${maxDistanceFromRoute}km)`);
    return sortedStations;
  };
  
  // KORREKT LOGIKK: Finn NØYAKTIG hvor batteriet når 10% og plasser ladestasjon DER
  const optimizeChargingStations = (routeDistance: number, routeGeometry: any) => {
    console.log('🚀 OPTIMIZE CHARGING STATIONS KALT!');
    console.log('📊 BATTERIPROSENT INPUT:', routeData.batteryPercentage, '%');
    console.log('📊 RouteDistance:', routeDistance, 'km');
    
    if (!selectedCar) {
      console.log('❌ Ingen bil valgt');
      return [];
    }

    const startBattery = routeData.batteryPercentage;
    const actualRange = selectedCar.range * 0.85;
    
    console.log(`🔋 DETALJERT BEREGNING:`);
    console.log(`   - Start batteri: ${startBattery}%`);  
    console.log(`   - Bil rekkevidde: ${actualRange}km`);
    console.log(`   - Rutelengde: ${routeDistance.toFixed(1)}km`);

    // DETALJERT beregning 
    const batteryForTravel = startBattery - 10;
    const distanceUntil10Percent = (batteryForTravel / 100) * actualRange;
    
    console.log(`🧮 STEG-FOR-STEG:`);
    console.log(`   1. Batteri tilgjengelig: ${startBattery}% - 10% = ${batteryForTravel}%`);
    console.log(`   2. Kjøredistanse med ${batteryForTravel}%: (${batteryForTravel}/100) × ${actualRange}km = ${distanceUntil10Percent.toFixed(1)}km`);
    console.log(`   3. Sammenligning: ${distanceUntil10Percent.toFixed(1)}km VS ${routeDistance.toFixed(1)}km`);
    console.log(`   4. Batteriet holder hele veien? ${distanceUntil10Percent >= routeDistance ? 'JA' : 'NEI'}`);
    
    if (distanceUntil10Percent >= routeDistance) {
      console.log(`🚨 FEIL! Dette kan ikke stemme - ${distanceUntil10Percent.toFixed(1)}km er ikke nok for ${routeDistance.toFixed(1)}km`);
    }
    
    if (distanceUntil10Percent >= routeDistance) {
      const finalBattery = startBattery - ((routeDistance / actualRange) * 100);
      console.log(`✅ BATTERIET HOLDER! Sluttbatteri vil være: ${finalBattery.toFixed(1)}%`);
      console.log(`📍 MEN VISER LIKEVEL HVOR BATTERIET VILLE NÅDD 10% (VED ${distanceUntil10Percent.toFixed(1)}km)`);
      // IKKE returner tom array - fortsett å vise hvor 10% ville vært
    } else {
      console.log(`🚨 BATTERIET NÅR 10% VED ${distanceUntil10Percent.toFixed(1)}km av ${routeDistance.toFixed(1)}km`);
    }
    
    console.log(`📍 LETER ETTER LADESTASJONER NÆR ${distanceUntil10Percent.toFixed(1)}km...`);

    // Finn ladestasjon nær dette punktet
    const stationsNearRoute = findStationsNearRoute(routeGeometry);
    const nearbyStations = stationsNearRoute
      .filter(s => s.available > 0)
      .filter(s => {
        const stationDist = (s as any).routeDistance || 0;
        const difference = Math.abs(stationDist - distanceUntil10Percent);
        console.log(`🔍 Stasjon ${s.name} er ved ${stationDist.toFixed(1)}km, forskjell: ${difference.toFixed(1)}km`);
        return difference <= 75; // Innen 75km fra 10%-punktet
      })
      .sort((a, b) => {
        const aDist = Math.abs(((a as any).routeDistance || 0) - distanceUntil10Percent);
        const bDist = Math.abs(((b as any).routeDistance || 0) - distanceUntil10Percent);
        return aDist - bDist;
      });

    if (nearbyStations.length === 0) {
      console.log(`❌ Ingen stasjon funnet nær ${distanceUntil10Percent.toFixed(1)}km (10%-punktet)`);
      return [];
    }

    const station = nearbyStations[0];
    const stationDistance = (station as any).routeDistance;
    
    // Beregn batteriprosent ved ankomst til stasjonen
    const batteryUsedToStation = (stationDistance / actualRange) * 100;
    const batteryAtStation = startBattery - batteryUsedToStation;
    
    // Sjekk om dette er obligatorisk eller valgfri lading
    const isRequired = distanceUntil10Percent < routeDistance;

    console.log(`🎯 VALGT: ${station.name} ved ${stationDistance.toFixed(1)}km`);
    console.log(`   - Bruker ${batteryUsedToStation.toFixed(1)}% batteri for å komme dit`);
    console.log(`   - Batteriprosent ved ankomst: ${batteryAtStation.toFixed(1)}%`);
    console.log(`   - Type: ${isRequired ? 'OBLIGATORISK' : 'VALGFRI'} lading`);

    const results = [{
      ...station,
      distance: stationDistance,
      arrivalBattery: Math.max(batteryAtStation, 0),
      departureBattery: 80,
      isRequired: isRequired // True hvis batteriet ikke holder, false hvis det holder
    }];

    // Sjekk om vi trenger flere stasjoner etter første lading
    const remainingDistanceAfterFirstStation = routeDistance - stationDistance;
    console.log(`🔄 SJEKKER OM VI TRENGER FLERE STASJONER:`);
    console.log(`   - Gjenstående rute etter første stasjon: ${remainingDistanceAfterFirstStation.toFixed(1)}km`);
    
    const distanceWith80Percent = (70 / 100) * actualRange; // 80% ned til 10%
    console.log(`   - Med 80% batteri kan vi kjøre: ${distanceWith80Percent.toFixed(1)}km til 10%`);
    
    if (remainingDistanceAfterFirstStation > distanceWith80Percent) {
      console.log(`🚨 TRENGER EN STASJON TIL!`);
      const secondStationPosition = stationDistance + distanceWith80Percent;
      
      const secondStations = stationsNearRoute
        .filter(s => s.available > 0)
        .filter(s => {
          const sDist = (s as any).routeDistance || 0;
          return Math.abs(sDist - secondStationPosition) <= 75;
        })
        .sort((a, b) => {
          const aDist = Math.abs(((a as any).routeDistance || 0) - secondStationPosition);
          const bDist = Math.abs(((b as any).routeDistance || 0) - secondStationPosition);
          return aDist - bDist;
        });

      if (secondStations.length > 0) {
        const secondStation = secondStations[0];
        const secondStationDistance = (secondStation as any).routeDistance;
        const batteryAtSecondStation = 80 - (((secondStationDistance - stationDistance) / actualRange) * 100);
        
        console.log(`🎯 ANDRE STASJON: ${secondStation.name} ved ${secondStationDistance.toFixed(1)}km`);
        console.log(`   - Batteriprosent ved ankomst: ${batteryAtSecondStation.toFixed(1)}%`);
        
        results.push({
          ...secondStation,
          distance: secondStationDistance,
          arrivalBattery: Math.max(batteryAtSecondStation, 0),
          departureBattery: 80,
          isRequired: true
        });
      }
    }

    console.log(`📊 RESULTAT: ${results.length} ladestasjoner nødvendig`);
    return results;
  };
  // Beregn vær-påvirkning (fallback hvis weather service ikke fungerer)
  // Beregn vær-påvirkning (fallback hvis weather service ikke fungerer)
  const calculateWeatherImpact = (): WeatherData => {
    return {
      temperature: Math.round(Math.random() * 20 - 5), // -5 til 15°C
      windSpeed: Math.round(Math.random() * 15), // 0-15 m/s
      windDirection: Math.round(Math.random() * 360),
      humidity: Math.round(Math.random() * 40 + 30), // 30-70%
      weatherCondition: ['Sol', 'Skyet', 'Regn', 'Snø'][Math.floor(Math.random() * 4)],
      visibility: Math.round(Math.random() * 10 + 5) // 5-15 km
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
        weather: weatherData
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
        weather: weatherData
      };
    }
  };

  // Kraftig cleanup av alle markører
  const forceCleanupAllMarkers = () => {
    console.log('🔧 KRAFT-CLEANUP: Fjerner alle markører i hele appen');
    
    // Fjern fra state
    markers.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // ignore
      }
    });
    setMarkers([]);
    
    // Fjern fra DOM
    const allChargingMarkers = document.querySelectorAll('.charging-marker');
    console.log(`🧹 Finner ${allChargingMarkers.length} gamle markører i DOM`);
    allChargingMarkers.forEach(el => {
      try {
        el.remove();
        console.log('🗑️ Fjernet gammel markør fra DOM');
      } catch (e) {
        console.log('Element allerede fjernet');
      }
    });
    
    // Sjekk også for mapbox markører generelt
    const allMapboxMarkers = document.querySelectorAll('.mapboxgl-marker');
    console.log(`🗺️ Finner ${allMapboxMarkers.length} totale mapbox markører`);
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
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite map with street labels
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

  // Hent koordinater for et stedsnavn via Mapbox Geocoding API
  const getCoordinatesForPlace = async (placeName: string): Promise<{ lat: number; lng: number } | null> => {
    // Sjekk først hardkodede koordinater
    const hardcodedCoords = cityCoordinates[placeName.toLowerCase().trim()];
    if (hardcodedCoords) {
      console.log(`Bruker hardkodede koordinater for ${placeName}:`, hardcodedCoords);
      return hardcodedCoords;
    }

    try {
      // Bruk Mapbox Geocoding API for andre steder
      const encodedPlace = encodeURIComponent(`${placeName}, Norge`);
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedPlace}.json?country=NO&types=place,locality,district,region&access_token=${mapboxToken}`;
      
      console.log(`Søker koordinater via Mapbox for: ${placeName}`);
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const coords = {
          lng: feature.center[0],
          lat: feature.center[1]
        };
        console.log(`Fant koordinater for ${placeName}:`, coords);
        return coords;
      } else {
        console.warn(`Ingen koordinater funnet for ${placeName}`);
        return null;
      }
    } catch (error) {
      console.error(`Feil ved søk etter koordinater for ${placeName}:`, error);
      return null;
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

    const fromCity = routeData.from.trim();
    const toCity = routeData.to.trim();
    const viaCity = routeData.via?.trim();
    
    console.log('Søker etter koordinater for:', { fromCity, toCity, viaCity });
    
    // Hent koordinater via Geocoding API
    const fromCoords = await getCoordinatesForPlace(fromCity);
    const toCoords = await getCoordinatesForPlace(toCity);
    const viaCoords = viaCity ? await getCoordinatesForPlace(viaCity) : null;

    if (!fromCoords || !toCoords) {
      console.error('Koordinater ikke funnet for steder');
      const missingPlaces = [];
      if (!fromCoords) missingPlaces.push(fromCity);
      if (!toCoords) missingPlaces.push(toCity);
      setError(`Kunne ikke finne koordinater for: ${missingPlaces.join(', ')}`);
      return;
    }

    if (viaCity && !viaCoords) {
      console.error('Koordinater ikke funnet for via-sted');
      setError(`Kunne ikke finne koordinater for via-sted: ${viaCity}`);
      return;
    }

    console.log('Koordinater funnet:', { fromCoords, toCoords, viaCoords });

    // Hent værdata for ruten
    const weather = await fetchWeatherData(fromCoords, toCoords, routeData.travelDate);
    setWeatherData(weather);

    cleanupMap();

    try {
      console.log('Henter rute fra Mapbox Directions API...');
      
      // Bygg rute-URL med via-punkt hvis det er spesifisert
      let coordinatesString = `${fromCoords.lng},${fromCoords.lat}`;
      if (viaCoords) {
        coordinatesString += `;${viaCoords.lng},${viaCoords.lat}`;
      }
      coordinatesString += `;${toCoords.lng},${toCoords.lat}`;
      
      // Bruk høyere oppløsning og flere parametere for mer nøyaktig rute
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&overview=full&steps=true&continue_straight=true&annotations=duration,distance,speed&access_token=${mapboxToken}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // Konverter til km
        
        console.log('Rute mottatt fra Mapbox:', { distance, duration: route.duration });
        
        // SIKRE CLEANUP FØR NY RUTE
        console.log('🧹 Eksplisitt cleanup før ny rute...');
        const layers = ['route-center', 'route', 'route-outline'];
        layers.forEach(layerId => {
          if (map.current!.getLayer(layerId)) {
            console.log(`🗑️ Fjerner eksisterende layer: ${layerId}`);
            map.current!.removeLayer(layerId);
          }
        });
        
        if (map.current!.getSource('route')) {
          console.log('🗑️ Fjerner eksisterende route source');
          map.current!.removeSource('route');
        }
        
        // Legg til rute på kartet med forbedret styling
        console.log('➕ Legger til ny route source...');
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

        // KRAFTIG CLEANUP - fjern ALLE markører
        console.log('🧹 KRAFTIG CLEANUP - fjerner alle markører...');
        
        // Fjern alle eksisterende markører fra state
        markers.forEach(marker => {
          try {
            marker.remove();
          } catch (e) {
            console.log('Markør allerede fjernet:', e);
          }
        });
        
        // Fjern alle DOM elementer med charging-marker klasse
        const oldChargingMarkers = document.querySelectorAll('.charging-marker');
        oldChargingMarkers.forEach(el => {
          try {
            el.remove();
          } catch (e) {
            console.log('DOM element allerede fjernet');
          }
        });
        
        // Tøm markers state
        setMarkers([]);
        
        console.log('🧹 Cleanup fullført - starter på nytt...');
        
        // Start helt på nytt med markører
        const allNewMarkers: mapboxgl.Marker[] = [];
        
        // BARE start og slutt markører
        console.log('📍 Legger til start markør...');
        const startMarker = new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat([fromCoords.lng, fromCoords.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h4>Start: ${routeData.from}</h4>`))
          .addTo(map.current!);
        allNewMarkers.push(startMarker);
        
        // Via-markør hvis spesifisert
        if (viaCoords && routeData.via) {
          console.log('📍 Legger til via markør...');
          const viaMarker = new mapboxgl.Marker({ color: '#f59e0b' })
            .setLngLat([viaCoords.lng, viaCoords.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<h4>Via: ${routeData.via}</h4>`))
            .addTo(map.current!);
          allNewMarkers.push(viaMarker);
        }
        
        console.log('📍 Legger til slutt markør...');
        const endMarker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([toCoords.lng, toCoords.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h4>Mål: ${routeData.to}</h4>`))
          .addTo(map.current!);
        allNewMarkers.push(endMarker);
        
        console.log('Optimaliserer ladestasjoner...');
        
        // Lagre rutedata for senere bruk
        lastRouteDataRef.current = {
          distance: distance,
          geometry: route.geometry
        };
        
        const optimizedStations = optimizeChargingStations(distance, route.geometry);
        console.log('🔍 RESULTAT fra optimizeChargingStations:', optimizedStations.length, 'stasjoner');
        optimizedStations.forEach((station, i) => {
          console.log(`📍 Stasjon ${i + 1}: ${station.name} på ${station.distance?.toFixed(1)}km - ${station.arrivalBattery?.toFixed(1)}% → ${station.departureBattery?.toFixed(1)}%`);
        });
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

        console.log('⚡ Sjekker ladestasjoner...');
        console.log('📊 Antall optimerte stasjoner:', optimizedStations.length);
        
        // BARE legg til ladestasjoner hvis de er obligatoriske
        optimizedStations.forEach((station, index) => {
          const isRequired = (station as any).isRequired;
          const arrivalBattery = (station as any).arrivalBattery || 50;
          
          if (!isRequired) {
            console.log(`⏭️ HOPPER OVER ${station.name} - ikke obligatorisk`);
            return;
          }
          
          console.log(`🚨 LEGGER TIL NY OBLIGATORISK STASJON: ${station.name}`);
          console.log(`📍 Koordinater: ${station.lat}, ${station.lng}`);
          
          const el = document.createElement('div');
          el.className = 'charging-marker charging-marker-' + Date.now(); // Unik klasse
          el.style.cssText = `
            background-color: #dc2626;
            border: 4px solid #ffffff;
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.8);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            position: relative;
          `;
          
          if (arrivalBattery <= 15) {
            el.innerHTML = `
              <span style="position: absolute; top: -8px; right: -8px; background: #fbbf24; color: #000; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white;">!</span>
              ⚡
            `;
          } else {
            el.textContent = '⚡';
          }

          if (!station.lat || !station.lng) {
            console.error(`❌ Ugyldig koordinater for ${station.name}`);
            return;
          }

          const marker = new mapboxgl.Marker(el)
            .setLngLat([station.lng, station.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-3">
                <h4 class="font-semibold text-sm mb-2">${station.name}</h4>
                <span class="bg-red-500 text-white text-xs px-2 py-1 rounded mb-2 inline-block">OBLIGATORISK</span>
                <p class="text-sm text-gray-600 mb-2">${station.location}</p>
                <div class="text-xs">
                  <div><strong>Ankomst batteri:</strong> <span class="text-red-600 font-bold">${Math.round(arrivalBattery)}%</span></div>
                  <div><strong>Avstand:</strong> ${Math.round(station.distance || 0)} km</div>
                  <div><strong>Ladetid:</strong> ${station.chargeTime} min</div>
                </div>
              </div>
            `))
            .addTo(map.current!);

          allNewMarkers.push(marker);
        });
        
        // Oppdater state med alle markører
        setMarkers(allNewMarkers);
        console.log(`✅ TOTALT ${allNewMarkers.length} markører på kartet:`, {
          start_slutt: allNewMarkers.length - optimizedStations.filter(s => (s as any).isRequired).length,
          obligatoriske_ladestasjoner: optimizedStations.filter(s => (s as any).isRequired).length
        });
        
        // Tilpass visningen til ruten
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([fromCoords.lng, fromCoords.lat]);
        if (viaCoords) {
          bounds.extend([viaCoords.lng, viaCoords.lat]);
        }
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
    console.log('🔄 RouteData ENDRET! Sjekker alle verdier:');
    console.log('- From:', routeData.from);
    console.log('- To:', routeData.to);
    console.log('- Via:', routeData.via);
    console.log('- 🔋 BATTERIPROSENT:', routeData.batteryPercentage, '%');
    console.log('- TrailerWeight:', routeData.trailerWeight);
    console.log('- SelectedCar:', selectedCar?.model);
    console.log('- MapboxToken tilgjengelig:', !!mapboxToken);
    console.log('- Map initialisert:', !!map.current);
    
    if (map.current && routeData.from && routeData.to && selectedCar && mapboxToken) {
      console.log('✅ ALLE KRITERIER OPPFYLT - oppdaterer rute med nye batteriprosent!');
      console.log('🔋 Oppdaterer med batteriprosent:', routeData.batteryPercentage, '%');
      
      // Fjern tidligere feil når vi prøver igjen
      setError(null);
      
      // BRUK KRAFT-CLEANUP
      forceCleanupAllMarkers();
      
      // Også traditional cleanup
      cleanupMap();
      setOptimizedStations([]);
      setRouteAnalysis(null);
      
      // Lengre delay for å sikre total cleanup
      setTimeout(() => {
        console.log('🚀 STARTER FULL RUTE-OPPDATERING med batteri:', routeData.batteryPercentage, '%');
        updateMapRoute();
      }, 200);  // Økt delay
    } else {
      console.log('❌ MANGLER KRITERIER for rute-oppdatering:');
      console.log('- Map:', !!map.current);
      console.log('- From:', !!routeData.from);
      console.log('- To:', !!routeData.to);
      console.log('- Car:', !!selectedCar);
      console.log('- Token:', !!mapboxToken);
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, routeData.trailerWeight, selectedCar?.id, mapboxToken]);

  // Legg til en separat useEffect som bare logger endringer  
  useEffect(() => {
    console.log('🔄🔄🔄 BATTERIPROSENT ENDRET TIL:', routeData.batteryPercentage, '%');
    console.log('🔄 Alle routeData verdier:');
    console.log('  - Fra:', routeData.from);
    console.log('  - Til:', routeData.to); 
    console.log('  - Via:', routeData.via);
    console.log('  - Batteri:', routeData.batteryPercentage, '%');
    console.log('  - Trailer:', routeData.trailerWeight);
    console.log('💡 Trykk "Planlegg rute" for å oppdatere kartet med nye innstillinger');
  }, [routeData.batteryPercentage, selectedCar]);

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
        
        {/* Debug info - HIDDEN for now */}
        {false && (
        <Card className="p-4 bg-blue-50">
          <p className="text-sm">
            <strong>Debug:</strong> 
            Kart lastet: {!loading ? '✅' : '❌'}, 
            Markører: {markers.length}, 
            Ladestasjoner: {optimizedStations.length},
            Token: {mapboxToken ? '✅' : '❌'}
          </p>
        </Card>
        )}
      </div>

      {/* Analyse og ladestasjoner */}
      <div className="w-full mt-6 bg-transparent">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">Ruteanalyse</h4>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full bg-transparent" style={{backgroundColor: 'transparent'}}>
          <TabsList className="grid w-full grid-cols-2 mb-4 !bg-transparent border border-border" style={{backgroundColor: 'transparent'}}>
            <TabsTrigger 
              value="analysis" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground !bg-transparent hover:bg-primary/10"
            >
              <TrendingUp className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger 
              value="stations" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground !bg-transparent hover:bg-primary/10"
            >
              <Zap className="h-4 w-4" />
              Ladestasjoner
            </TabsTrigger>
          </TabsList>

        <TabsContent value="analysis" className="space-y-4 bg-transparent">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <Route className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total distanse</p>
                    <p className="text-2xl font-bold text-foreground">{(() => {
                      console.log('🔍 RouteAnalysis status:', { routeAnalysis, hasData: !!routeAnalysis });
                      return routeAnalysis ? Math.round(routeAnalysis.totalDistance) : '---';
                    })()} km</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total tid</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis ? Math.round(routeAnalysis.totalTime) : '---'}t</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ladekostnad</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis ? Math.round(routeAnalysis.totalCost) : '---'} kr</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ladetid</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis ? Math.round(routeAnalysis.chargingTime) : '---'} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CO₂ spart</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis ? Math.round(routeAnalysis.co2Saved) : '---'} kg</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Effektivitet</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis ? Math.round(routeAnalysis.efficiency) : '---'}%</p>
                  </div>
                </div>
              </Card>
             </div>

             {/* Weather Impact Section */}
             {weatherData && (
               <Card className="p-4 mt-4">
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                   <Thermometer className="h-5 w-5 text-primary" />
                   Værpåvirkning på rekkevidde
                 </h3>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                   <div className="text-center">
                     <p className="text-sm text-muted-foreground">Start</p>
                     <p className="text-lg font-bold">{weatherData.startWeather.temperature}°C</p>
                     <p className="text-sm">{weatherData.startWeather.weatherCondition}</p>
                   </div>
                   
                   <div className="text-center">
                     <p className="text-sm text-muted-foreground">Destinasjon</p>
                     <p className="text-lg font-bold">{weatherData.endWeather.temperature}°C</p>
                     <p className="text-sm">{weatherData.endWeather.weatherCondition}</p>
                   </div>
                   
                   <div className="text-center">
                     <p className="text-sm text-muted-foreground">Gjennomsnitt vind</p>
                     <p className="text-lg font-bold flex items-center gap-1 justify-center">
                       <Wind className="h-4 w-4" />
                       {weatherData.averageConditions.windSpeed} km/t
                     </p>
                   </div>
                   
                   <div className="text-center">
                     <p className="text-sm text-muted-foreground">Rekkevidde-påvirkning</p>
                     <p className={`text-lg font-bold ${weatherData.rangeFactor >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                       {weatherData.rangeFactor >= 1 ? '+' : ''}{Math.round((weatherData.rangeFactor - 1) * 100)}%
                     </p>
                   </div>
                 </div>

                 <div className="bg-muted/50 p-3 rounded-lg">
                   <p className="text-sm">
                     <strong>Værfaktorer som påvirker rekkevidde:</strong>
                   </p>
                   <ul className="text-sm mt-2 space-y-1">
                     <li>• Temperatur: {weatherData.averageConditions.temperature}°C</li>
                     <li>• Luftfuktighet: {weatherData.averageConditions.humidity}%</li>
                     <li>• Vindforhold: {weatherData.averageConditions.windSpeed} km/t</li>
                     <li>• Værforhold: {weatherData.startWeather.weatherCondition}</li>
                   </ul>
                 </div>
                </Card>
             )}
          </TabsContent>

        <TabsContent value="stations" className="space-y-4 bg-transparent">
          <div className="grid gap-4">
            {optimizedStations.length > 0 ? (
              <>
                {/* Vis obligatoriske stasjoner først */}
                {optimizedStations.filter((station: any) => station.isRequired).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                      ⚠️ Obligatoriske ladestoppler
                    </h4>
                    {optimizedStations.filter((station: any) => station.isRequired).map((station, index) => (
                      <Card key={station.id} className="p-4 border-red-200 bg-red-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">
                                OBLIGATORISK STOPP {index + 1}
                              </Badge>
                              <h4 className="font-semibold">{station.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{station.location}</p>
                            
                            <div className="bg-card/90 p-3 rounded border border-border">
                              <p className="text-sm font-medium text-red-600 mb-2">
                                Du må lade her - batteriet blir {Math.round((station as any).arrivalBattery || 0)}% ved ankomst
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p><strong>Avstand fra start:</strong> {Math.round(station.distance || 0)} km</p>
                                  <p><strong>Ankomst batteri:</strong> <span className="text-red-600 font-bold">{Math.round((station as any).arrivalBattery || 0)}%</span></p>
                                </div>
                                <div>
                                  <p><strong>Ladetid:</strong> {station.chargeTime} min</p>
                                  <p><strong>Etter lading:</strong> <span className="text-green-600 font-bold">{Math.round((station as any).departureBattery || 0)}%</span></p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(station.available / station.total) * 100} 
                                className="flex-1 h-2"
                              />
                              <span className="text-xs">
                                {station.available}/{station.total}
                              </span>
                            </div>
                            
                            <Badge variant={
                              station.available / station.total > 0.5 ? "default" : 
                              station.available > 0 ? "secondary" : "destructive"
                            }>
                              {station.fastCharger ? "⚡ Hurtiglader" : "Standard"}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Vis valgfrie stasjoner */}
                {optimizedStations.filter((station: any) => !(station as any).isRequired).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      💡 Alternative ladestoppler
                    </h4>
                    {optimizedStations.filter((station: any) => !(station as any).isRequired).map((station, index) => (
                      <Card key={station.id} className="p-4 border-green-200 bg-green-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                Valgfritt stopp {index + 1}
                              </Badge>
                              <h4 className="font-semibold">{station.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{station.location}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>Distanse:</strong> {Math.round(station.distance || 0)} km</p>
                                <p><strong>Ladetid:</strong> {station.chargeTime} min</p>
                              </div>
                              <div>
                                <p><strong>Lading:</strong> {station.chargeAmount} kWh</p>
                                <p><strong>Kostnad:</strong> {station.cost} kr</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(station.available / station.total) * 100} 
                                className="flex-1 h-2"
                              />
                              <span className="text-xs">
                                {station.available}/{station.total}
                              </span>
                            </div>
                            
                            <Badge variant={
                              station.available / station.total > 0.5 ? "default" : 
                              station.available > 0 ? "secondary" : "destructive"
                            }>
                              {station.fastCharger ? "⚡ Hurtiglader" : "Standard"}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
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
    </div>
  );
}