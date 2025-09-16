import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
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
}

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fastCharger: boolean;
  power: string;
  cost: number;
  distanceFromRoute?: number;
  distanceAlongRoute?: number;
  arrivalBatteryPercentage?: number;
  isRequired?: boolean;
  chargingTime?: number;
  targetBatteryPercentage?: number;
}

interface WeatherData {
  startWeather: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    humidity: number;
    weatherCondition: string;
    visibility: number;
  };
  endWeather: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    humidity: number;
    weatherCondition: string;
    visibility: number;
  };
  averageConditions: {
    temperature: number;
    windSpeed: number;
    humidity: number;
  };
  rangeFactor: number;
}

interface RouteWeatherData {
  weather: WeatherData;
}

interface TripAnalysis {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  chargingTime: number;
  co2Saved: number;
  efficiency: number;
  weather?: WeatherData;
}

interface RouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel;
  routeTrigger?: number;
  selectedRouteId?: string | null;
  onChargingStationUpdate?: (station: ChargingStation | null, showButton: boolean, optimizedStations?: ChargingStation[]) => void;
  onRouteAnalysisUpdate?: (analysis: TripAnalysis | null) => void;
}

// Modal state
interface ChargingModalData {
  isOpen: boolean;
  stationId: string;
  stationName: string;
  distance: number;
  arrivalBattery: number;
}

// Koordinater for norske byer
const cityCoordinates: Record<string, [number, number]> = {
  'oslo': [10.7522, 59.9139],
  'bergen': [5.3221, 60.3913],
  'trondheim': [10.3951, 63.4305],
  'stavanger': [5.7331, 58.9700],
  'tromsø': [18.9553, 69.6696],
  'drammen': [10.2045, 59.7436],
  'fredrikstad': [10.9298, 59.2181],
  'kristiansand': [8.0182, 58.1599],
  'sandnes': [5.7357, 58.8516],
  'tønsberg': [10.4078, 59.2674],
  'sarpsborg': [11.1070, 59.2839],
  'skien': [9.6090, 59.2085],
  'ålesund': [6.1575, 62.4722],
  'sandefjord': [10.2280, 59.1289],
  'bodø': [14.3951, 67.2804],
  'molde': [7.1574, 62.7378],
  'harstad': [16.5639, 68.7989],
  'lillehammer': [10.4662, 61.1272],
  'hammerfest': [23.6821, 70.6634],
  'alta': [23.2716, 69.9689],
  'kirkenes': [30.0456, 69.7272],
  'narvik': [17.4272, 68.4384],
  'mo i rana': [14.1424, 66.3128],
  'leknes': [13.6150, 68.1486]
};

// Funksjon for å få rutens farge basert på type
const getRouteColor = (routeType: string): string => {
  switch (routeType) {
    case 'fastest':
      return '#3b82f6'; // Blå
    case 'shortest':
      return '#22c55e'; // Grønn
    case 'eco':
      return '#a855f7'; // Lilla
    default:
      return '#3b82f6'; // Standard blå
  }
};

// Hent ladestasjoner fra database
async function fetchNorwegianChargingStations(): Promise<ChargingStation[]> {
  try {
    console.log('🔌 RouteMap: Henter ladestasjoner fra database...');
    const { data, error } = await supabase
      .from('charging_stations')
      .select('*');
    
    if (error) {
      console.error('❌ RouteMap: Feil ved henting av ladestasjoner:', error);
      return []; // Returnerer tom array ved feil
    }
    
    console.log('✅ RouteMap: Hentet', data?.length || 0, 'ladestasjoner fra database');
    console.log('📊 RouteMap: Første 3 stasjoner:', data?.slice(0, 3).map(s => s.name));
    
    if (!data || data.length === 0) {
      console.log('⚠️ RouteMap: Ingen ladestasjoner funnet i database');
      return [];
    }
    
    // Konverter database-format til intern format
    const stations: ChargingStation[] = data.map(station => ({
      id: station.id,
      name: station.name,
      location: station.location,
      latitude: Number(station.latitude),
      longitude: Number(station.longitude),
      available: station.available,
      total: station.total,
      fastCharger: station.fast_charger,
      power: station.power,
      cost: Number(station.cost)
    }));
    
    console.log('🔄 RouteMap: Konverterte', stations.length, 'stasjoner til intern format');
    return stations;
  } catch (error) {
    console.error('❌ RouteMap: Uventet feil ved henting av ladestasjoner:', error);
    console.log('🔄 RouteMap: Returnerer tom array på grunn av exception');
    return [];
  }
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Funksjon for å beregne realistiske progressive ladestasjoner basert på faktisk batteristatus
function calculateRealisticChargingStations(
  routeCoordinates: number[][],
  routeDistance: number,
  car: CarModel,
  initialBatteryPercentage: number,
  allStations: ChargingStation[],
  trailerWeight: number = 0
): { firstCycleStations: ChargingStation[], secondCycleStations: ChargingStation[], allCycles: ChargingStation[][] } {
  console.log('🔋 BEREGNER REALISTISKE LADESTASJONER');
  console.log('📊 Start batteri:', initialBatteryPercentage + '%');
  console.log('📊 Bil rekkevidde:', car.range + 'km');
  console.log('📊 Total rute:', routeDistance.toFixed(1) + 'km');
  console.log('📊 Hengervekt:', trailerWeight + 'kg');
  
  // Juster rekkevidde basert på hengervekt
  const trailerFactor = trailerWeight > 0 ? 1 + (trailerWeight * 0.0015) : 1;
  const adjustedRange = car.range / trailerFactor;
  console.log('📊 Justert rekkevidde:', adjustedRange.toFixed(1) + 'km (faktor:', trailerFactor.toFixed(3) + ')');
  
  const criticalLevel = 15; // Kritisk batterinivå
  const chargeLevel = 80; // Lader til 80%
  
  const allCycles: ChargingStation[][] = [];
  
  // FØRSTE SYKLUS: Fra startbatteri til første kritiske nivå
  const firstCycleRange = (adjustedRange * (initialBatteryPercentage - criticalLevel)) / 100;
  console.log('🔵 FØRSTE SYKLUS: Kan kjøre', firstCycleRange.toFixed(1), 'km før første lading nødvendig');
  
  const firstCycleStations = findStationsAtDistance(
    routeCoordinates, 
    routeDistance, 
    allStations, 
    firstCycleRange, 
    'FØRSTE KRITISKE PUNKT'
  );
  allCycles.push(firstCycleStations);
  
  // ANDRE SYKLUS: Fra 80% til neste kritiske nivå
  const secondCycleRange = (adjustedRange * (chargeLevel - criticalLevel)) / 100;
  const secondCycleStartDistance = firstCycleRange;
  console.log('🔵 ANDRE SYKLUS: Fra', secondCycleStartDistance.toFixed(1), 'km, kan kjøre', secondCycleRange.toFixed(1), 'km til');
  
  const secondCycleStations = findStationsAtDistance(
    routeCoordinates,
    routeDistance, 
    allStations, 
    secondCycleStartDistance + secondCycleRange,
    'ANDRE KRITISKE PUNKT'
  );
  allCycles.push(secondCycleStations);
  
  // TREDJE SYKLUS og videre (hvis nødvendig)
  let currentDistance = secondCycleStartDistance + secondCycleRange;
  let cycleNumber = 3;
  
  while (currentDistance < routeDistance && cycleNumber <= 5) {
    const nextCycleEndDistance = currentDistance + secondCycleRange; // Samme rekkevidde fra 80% til 15%
    console.log('🔵 SYKLUS', cycleNumber + ':', 'Fra', currentDistance.toFixed(1), 'km til', nextCycleEndDistance.toFixed(1), 'km');
    
    const nextCycleStations = findStationsAtDistance(
      routeCoordinates,
      routeDistance,
      allStations,
      nextCycleEndDistance,
      `SYKLUS ${cycleNumber} KRITISKE PUNKT`
    );
    
    if (nextCycleStations.length > 0) {
      allCycles.push(nextCycleStations);
    }
    
    currentDistance = nextCycleEndDistance;
    cycleNumber++;
  }
  
  console.log('✅ Beregnet', allCycles.length, 'totale ladesykluser');
  allCycles.forEach((cycle, index) => {
    console.log(`   Syklus ${index + 1}:`, cycle.length, 'stasjoner');
  });
  
  return {
    firstCycleStations,
    secondCycleStations,
    allCycles
  };
}

// Hjelpefunksjon for å finne stasjoner på en bestemt avstand langs ruten
function findStationsAtDistance(
  routeCoordinates: number[][],
  routeDistance: number,
  allStations: ChargingStation[],
  targetDistance: number,
  cycleDescription: string
): ChargingStation[] {
  console.log('🎯', cycleDescription, '- Søker stasjoner rundt', targetDistance.toFixed(1), 'km');
  
  if (targetDistance >= routeDistance) {
    console.log('✅ Ikke nødvendig -', targetDistance.toFixed(1), 'km er forbi destinasjonen på', routeDistance.toFixed(1), 'km');
    return [];
  }
  
  const searchRadius = 30; // Søk 30km før og etter målpunktet
  
  const candidateStations = allStations.filter(station => {
    // Beregn stasjonens omtrentlige posisjon langs ruten
    let minDistanceToRoute = Infinity;
    let stationDistanceAlongRoute = 0;
    
    for (let i = 0; i < routeCoordinates.length; i++) {
      const distanceToPoint = getDistance(
        station.latitude,
        station.longitude,
        routeCoordinates[i][1],
        routeCoordinates[i][0]
      );
      
      if (distanceToPoint < minDistanceToRoute) {
        minDistanceToRoute = distanceToPoint;
        stationDistanceAlongRoute = (i / routeCoordinates.length) * routeDistance;
      }
    }
    
    // Må være nær ruten (under 5km) og i søkeområdet
    const isNearRoute = minDistanceToRoute <= 5.0;
    const isInSearchArea = stationDistanceAlongRoute >= (targetDistance - searchRadius) && 
                          stationDistanceAlongRoute <= (targetDistance + searchRadius);
    
    if (isNearRoute && isInSearchArea) {
      console.log('  ✓ Kandidat:', station.name, 'på', stationDistanceAlongRoute.toFixed(1), 'km (', minDistanceToRoute.toFixed(1), 'km fra rute)');
    }
    
    return isNearRoute && isInSearchArea;
  });
  
  // Sorter etter kvalitet og ta de 2 beste
  const sortedStations = candidateStations
    .map(station => ({
      ...station,
      qualityScore: 
        (station.available / station.total * 30) + // Tilgjengelighet (30%)
        (station.fastCharger ? 40 : 10) +          // Hurtiglading (40% vs 10%)
        (station.cost <= 5.0 ? 20 : 0) +          // Rimelig pris (20%)
        (station.power.includes('250') ? 10 : 5)   // Høy effekt (10% vs 5%)
    }))
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 2);
  
  console.log('🎯', cycleDescription, '- Valgte', sortedStations.length, 'beste stasjoner');
  sortedStations.forEach((station, index) => {
    console.log(`    ${index + 1}. ${station.name} (Score: ${station.qualityScore})`);
  });
  
  return sortedStations;
}

// Cache for værdata for å unngå dupliserte API-kall
const weatherCache = new Map<string, { data: any, timestamp: number }>();
const WEATHER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutter

// Optimalisert værdata-henting med cache
const fetchWeatherData = async (startCoords: [number, number], endCoords: [number, number]) => {
  const cacheKey = `${startCoords[0]}-${startCoords[1]}-${endCoords[0]}-${endCoords[1]}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < WEATHER_CACHE_DURATION) {
    console.log('☁️ Bruker cached værdata');
    return cached.data;
  }
  
  console.log('🌤️ Henter ny værdata...');
  const { data, error } = await supabase.functions.invoke('weather-service', {
    body: { 
      startLat: startCoords[1], 
      startLng: startCoords[0], 
      endLat: endCoords[1], 
      endLng: endCoords[0] 
    }
  });
  
  if (error) throw error;
  
  // Lagre i cache
  weatherCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

const RouteMap: React.FC<RouteMapProps> = ({ isVisible, routeData, selectedCar, routeTrigger, selectedRouteId, onChargingStationUpdate, onRouteAnalysisUpdate }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Throttle API-kall
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  
  // Modal state for charging percentage input
  const [chargingModal, setChargingModal] = useState<ChargingModalData>({
    isOpen: false,
    stationId: '',
    stationName: '',
    distance: 0,
    arrivalBattery: 0
  });
  const [chargePercentInput, setChargePercentInput] = useState<string>('80');
  const [activeTab, setActiveTab] = useState<string>("analysis");
  const [chargingProgress, setChargingProgress] = useState(0); // Hvor mange ganger du har ladet
  const [nextChargingStations, setNextChargingStations] = useState<ChargingStation[]>([]); // Neste stasjoner å vise
  const [currentChargingStation, setCurrentChargingStation] = useState<ChargingStation | null>(null); // Aktiv ladestasjon
  const [showChargingButton, setShowChargingButton] = useState(false); // Vis ladeknapp
  const [liveStationData, setLiveStationData] = useState<Record<string, ChargingStation>>({});
  
  // Ny state for interaktiv lading
  const [showChargingDialog, setShowChargingDialog] = useState(false);
  const [selectedChargingStation, setSelectedChargingStation] = useState<ChargingStation | null>(null);
  const [selectedBatteryPercent, setSelectedBatteryPercent] = useState(80);
  const [currentRoute, setCurrentRoute] = useState<any>(null); // Lagrer current route for re-kalkulering

  const { toast } = useToast();

  // Forbedret funksjon for å sende stasjoner til ladestasjonkartet
  const sendStationsToChargingMap = (stations: ChargingStation[], mainStation?: ChargingStation) => {
    const primaryStation = mainStation || stations[0];
    console.log('🔌 SENDER', stations.length, 'STASJONER TIL LADESTASJONKART, hovedstasjon:', primaryStation?.name);
    
    // VIKTIG: Send kun stasjonene som faktisk er synlige på kartet
    const visibleStations = stations.filter(station => {
      // Sjekk om stasjonen har en markør på kartet
      const marker = document.querySelector(`[data-station-id="${station.id}"]`);
      return marker !== null;
    });
    
    console.log('🔌 Filtrerte til', visibleStations.length, 'synlige stasjoner:', visibleStations.map(s => s.name));
    
    setCurrentChargingStation(primaryStation);
    setShowChargingButton(true);
    onChargingStationUpdate?.(primaryStation, true, visibleStations);
  };

  // Enkel funksjon for å sende enkelt stasjon til ladestasjonkartet (bakoverkompatibilitet)
  const sendStationToChargingMap = (station: ChargingStation) => {
    sendStationsToChargingMap([station], station);
  };

  // Beregn RIKTIG kostnad OG ladetid når bruker velger ladingsprosent
  const updateAnalysisWithCharging = (chargePercent: number) => {
    console.log('🔥🔥🔥 updateAnalysisWithCharging STARTET MED:', chargePercent + '%');
    
    if (!currentRoute || !routeData || isNaN(chargePercent)) {
      console.error('❌ KRITISK: Mangler data:', { 
        currentRoute: !!currentRoute, 
        routeData: !!routeData, 
        chargePercent: chargePercent 
      });
      return;
    }
    
    const routeDistanceKm = currentRoute.distance / 1000;
    const routeDurationHours = currentRoute.duration / 3600;
    
    console.log('📊 BEREGNINGSDATA:', { 
      distance: routeDistanceKm + 'km', 
      chargePercent: chargePercent + '%' 
    });
    
    // JUSTERTE REALISTISKE BEREGNINGER
    const forbrukPer100km = 18; // kWh/100km
    const totalEnergi = (routeDistanceKm / 100) * forbrukPer100km;
    const ladepris = 2.5; // kr/kWh
    
    // MINDRE kostnad - kun den energien som faktisk brukes på ladingen
    const kostnadPerStasjon = Math.round(totalEnergi * ladepris * (chargePercent / 100) * 0.3); // 30% av beregning
    
    // Færre stopp - mer realistisk
    const carRange = selectedCar?.range || 441;
    const antallStopp = Math.max(1, Math.ceil(routeDistanceKm / (carRange * 0.9))); // 90% utnyttelse
    const totalKostnad = kostnadPerStasjon * antallStopp;
    
    // KORTERE ladetid - mer realistisk for hurtiglading
    const minutterPerStopp = Math.round(15 + (chargePercent * 0.25)); // 15-40 min
    const totalLadetid = antallStopp * minutterPerStopp;
    
    console.log('🔢 BEREGNING updateAnalysisWithCharging:', {
      prosent: chargePercent,
      kostnadPerStasjon,
      antallStopp,
      totalKostnad,
      minutterPerStopp,
      totalLadetid
    });
    
    const updatedAnalysis = {
      totalDistance: routeDistanceKm,
      totalTime: routeDurationHours + (totalLadetid / 60),
      totalCost: totalKostnad,
      chargingTime: totalLadetid,
      co2Saved: Math.round(routeDistanceKm * 0.13),
      efficiency: 0.88,
      weather: undefined
    };
    
    console.log('🔥 SETTER NY ANALYSE:', updatedAnalysis);
    
    try {
      setRouteAnalysis(updatedAnalysis);
      onRouteAnalysisUpdate?.(updatedAnalysis);
      console.log('✅ setRouteAnalysis UTFØRT!');
    } catch (error) {
      console.error('❌ FEIL VED setRouteAnalysis:', error);
    }
  };

// Fullstendig batterioptimeringsalgoritme som beregner alle kritiske punkter langs hele ruten
  const calculateAllCriticalPoints = (
    startBatteryPercent: number,
    route: any,
    car: CarModel,
    allStations: ChargingStation[]
  ): ChargingStation[] => {
    console.log('🔋🔋🔋 STARTER FORBEDRET BATTERIOPTIMERING 🔋🔋🔋');
    console.log('📊 Start batteri:', startBatteryPercent + '%');
    console.log('📊 Bil rekkevidde:', car.range + 'km');
    console.log('📊 Total rutelengde:', (route.distance / 1000).toFixed(1) + 'km');
    console.log('📊 Tilgjengelige stasjoner:', allStations.length);
    
    const routeCoords = route.geometry.coordinates;
    const totalRouteKm = route.distance / 1000;
    const criticalLevel = 15; // Kritisk batterinivå
    const targetChargeLevel = 80; // Standard ladenivå
    
    let allOptimizedStations: ChargingStation[] = [];
    let currentBatteryPercent = startBatteryPercent;
    let currentPositionKm = 0;
    let cycleNumber = 1;
    
    // Beregn hvor langt vi kan kjøre med startnivået
    while (currentPositionKm < totalRouteKm && cycleNumber <= 10) {
      const usableBatteryRange = currentBatteryPercent - criticalLevel;
      const rangeKm = (car.range * usableBatteryRange) / 100;
      const nextCriticalPositionKm = currentPositionKm + rangeKm;
      
      console.log(`🔵 SYKLUS ${cycleNumber}:`);
      console.log(`  📍 Nåværende posisjon: ${currentPositionKm.toFixed(1)} km`);
      console.log(`  🔋 Batteri nå: ${currentBatteryPercent}%`);
      console.log(`  🚗 Kan kjøre: ${rangeKm.toFixed(1)} km`);
      console.log(`  🎯 Kritisk punkt ved: ${nextCriticalPositionKm.toFixed(1)} km`);
      
      // Hvis vi når destinasjonen med nåværende batteri, stopp
      if (nextCriticalPositionKm >= totalRouteKm) {
        console.log(`✅ SYKLUS ${cycleNumber}: Når destinasjonen uten mer lading!`);
        break;
      }
      
      // Finn beste ladestasjon nær det kritiske punktet - FORBEDRET SØKELOGIKK
      const searchRadius = 60; // Økt søkeradius dramatisk
      const stationSearchStart = Math.max(currentPositionKm + 5, nextCriticalPositionKm - searchRadius);
      const stationSearchEnd = Math.min(totalRouteKm, nextCriticalPositionKm + searchRadius);
      
      console.log(`  🔍 SØKER STASJONER mellom ${stationSearchStart.toFixed(1)} og ${stationSearchEnd.toFixed(1)} km`);
      console.log(`  🔍 SØKERADIUS: ${searchRadius}km fra kritisk punkt`);
      
      const candidateStations = allStations.filter(station => {
        let stationPositionKm = 0;
        let minDistToRoute = Infinity;
        
        // Finn stasjonens posisjon langs ruten
        for (let i = 0; i < routeCoords.length; i++) {
          const distanceToPoint = getDistance(
            station.latitude,
            station.longitude,
            routeCoords[i][1],
            routeCoords[i][0]
          );
          
          if (distanceToPoint < minDistToRoute) {
            minDistToRoute = distanceToPoint;
            stationPositionKm = (i / routeCoords.length) * totalRouteKm;
          }
        }
        
        // MEGET LIBERALE KRITERIER for å finne flere stasjoner  
        const isNearRoute = minDistToRoute <= 15.0; // Økt til 15km - meget liberal
        const isInSearchArea = stationPositionKm >= stationSearchStart && 
                              stationPositionKm <= stationSearchEnd;
        const isAhead = stationPositionKm > currentPositionKm; // Bare fremover
        
        if (isNearRoute && isInSearchArea && isAhead) {
          station.distanceAlongRoute = stationPositionKm;
          console.log(`    ✓ KANDIDAT: ${station.name} ved ${stationPositionKm.toFixed(1)} km (${minDistToRoute.toFixed(1)} km fra rute)`);
        }
        
        return isNearRoute && isInSearchArea && isAhead;
      });
      
      console.log(`  🎯 Fant ${candidateStations.length} kandidatstasjoner for syklus ${cycleNumber}`);
      
      if (candidateStations.length === 0) {
        console.log(`❌ SYKLUS ${cycleNumber}: INGEN stasjoner funnet! Prøver med enda mer liberale kriterier...`);
        // Hopp fremover og prøv igjen  
        currentPositionKm = nextCriticalPositionKm + 50;
        continue;
      }
      
      // Sorter og velg beste stasjon basert på kvalitet
      const bestStations = candidateStations
        .map(station => ({
          ...station,
          qualityScore: 
            (station.available / station.total * 25) + // Tilgjengelighet
            (station.fastCharger ? 35 : 15) +          // Hurtiglading viktig
            (station.cost <= 4.0 ? 25 : 10) +         // Rimelig pris
            (station.power.includes('150') || station.power.includes('250') || station.power.includes('300') ? 15 : 5) // Høy effekt
        }))
        .sort((a, b) => b.qualityScore - a.qualityScore);
      
      const bestStation = bestStations[0];
      console.log(`  🎯 VALGT STASJON: ${bestStation.name} ved ${bestStation.distanceAlongRoute?.toFixed(1)} km (Score: ${bestStation.qualityScore})`);
      
      // Legg til i optimerte stasjoner
      allOptimizedStations.push(bestStation);
      
      // Oppdater posisjon og batterinivå for neste iterasjon
      currentPositionKm = bestStation.distanceAlongRoute || nextCriticalPositionKm;
      currentBatteryPercent = targetChargeLevel; // Lader til 80%
      cycleNumber++;
    }
    
    console.log(`✅✅✅ BATTERIOPTIMERING FULLFØRT! ✅✅✅`);
    console.log(`📊 Totalt ${allOptimizedStations.length} ladestasjoner valgt:`);
    allOptimizedStations.forEach((station, index) => {
      console.log(`  ${index + 1}. ${station.name} ved ${station.distanceAlongRoute?.toFixed(1)} km`);
    });
    
    // SIKRE MINIMUM 2 STASJONER for lange ruter
    if (allOptimizedStations.length < 2 && totalRouteKm > 400) {
      console.log('⚠️⚠️ UNDER 2 STASJONER! Legger til fallback-stasjoner...');
      
      // Finn stasjoner langs ruten som backup
      const backupStations = allStations
        .filter(station => !allOptimizedStations.some(s => s.id === station.id))
        .map(station => {
          let stationPositionKm = 0;
          let minDistToRoute = Infinity;
          
          // Finn posisjon langs ruten
          for (let i = 0; i < routeCoords.length; i++) {
            const distanceToPoint = getDistance(
              station.latitude,
              station.longitude,
              routeCoords[i][1],
              routeCoords[i][0]
            );
            
            if (distanceToPoint < minDistToRoute) {
              minDistToRoute = distanceToPoint;
              stationPositionKm = (i / routeCoords.length) * totalRouteKm;
            }
          }
          
          return {
            ...station,
            distanceAlongRoute: stationPositionKm,
            distanceFromRoute: minDistToRoute
          };
        })
        .filter(station => station.distanceFromRoute <= 20.0 && station.distanceAlongRoute > 100 && station.distanceAlongRoute < totalRouteKm - 100)
        .sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute)
        .slice(0, 3 - allOptimizedStations.length);
      
      console.log(`🔄 Legger til ${backupStations.length} backup-stasjoner`);
      allOptimizedStations.push(...backupStations);
    }
    
    console.log(`🎯🎯 ENDELIG RESULTAT: ${allOptimizedStations.length} STASJONER 🎯🎯`);
    return allOptimizedStations;
  };

  // Forbedret funksjon for å beregne neste kritiske punkter
  const calculateNextCriticalPoints = (
    currentStation: ChargingStation,
    batteryPercent: number,
    route: any,
    car: CarModel,
    allStations: ChargingStation[]
  ): ChargingStation[] => {
    console.log('🔋 Beregner neste kritiske punkter med', batteryPercent, '% batteri');
    
    // Finn nåværende stasjonens posisjon langs ruten
    const routeCoords = route.geometry.coordinates;
    let currentStationPosition = currentStation.distanceAlongRoute || 0;
    
    if (!currentStation.distanceAlongRoute) {
      let minDistance = Infinity;
      for (let i = 0; i < routeCoords.length; i++) {
        const distance = getDistance(
          currentStation.latitude,
          currentStation.longitude,
          routeCoords[i][1],
          routeCoords[i][0]
        );
        if (distance < minDistance) {
          minDistance = distance;
          currentStationPosition = (i / routeCoords.length) * (route.distance / 1000);
        }
      }
    }
    
    // Beregn rekkevidde fra valgt batteriprosent til kritisk nivå (15%)
    const usableBatteryRange = batteryPercent - 15;
    const rangeKm = (car.range * usableBatteryRange) / 100;
    const nextCriticalPosition = currentStationPosition + rangeKm;
    
    console.log('📍 Nåværende posisjon:', currentStationPosition.toFixed(1), 'km');
    console.log('🔋 Rekkevidde med', batteryPercent + '%:', rangeKm.toFixed(1), 'km');
    console.log('🎯 Neste kritiske punkt:', nextCriticalPosition.toFixed(1), 'km');
    
    // Bruk samme optimeringslogikk som calculateAllCriticalPoints
    const remainingRoute = {
      ...route,
      distance: (route.distance / 1000 - currentStationPosition) * 1000 // Gjenværende distanse
    };
    
    return calculateAllCriticalPoints(batteryPercent, route, car, allStations)
      .filter(station => (station.distanceAlongRoute || 0) > currentStationPosition)
      .slice(0, 3); // Maksimalt 3 neste stasjoner
  };

  // Funksjon for å håndtere interaktiv lading
  const handleInteractiveCharging = () => {
    if (!selectedChargingStation || !currentRoute) return;
    
    console.log('🔋 STARTER INTERAKTIV LADING:', selectedChargingStation.name, 'til', selectedBatteryPercent + '%');
    
    // Fjern alle gamle blå markører
    const oldMarkers = document.querySelectorAll('.progressive-charging-marker');
    oldMarkers.forEach(marker => marker.remove());
    
    // Beregn alle neste kritiske punkter fra denne posisjonen
    const nextStations = calculateNextCriticalPoints(
      selectedChargingStation,
      selectedBatteryPercent,
      currentRoute,
      selectedCar!,
      chargingStations
    );
    
    console.log(`🔵 LEGGER TIL ${nextStations.length} NYE BLÅ MARKØRER`);
    
    // Legg til alle nye blå markører
    nextStations.forEach((station, index) => {
      const el = document.createElement('div');
      el.className = 'progressive-charging-marker';
      el.style.cssText = `
        background: linear-gradient(135deg, #0066ff, #00aaff);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        z-index: 100;
        box-shadow: 0 0 25px rgba(0, 102, 255, 0.9), 0 0 50px rgba(0, 170, 255, 0.5);
        animation: pulse 2s infinite;
      `;
      el.innerHTML = `${index + 1}`; // Nummerer markørene

          // Rekursiv click handler for nye stasjoner med rutevisning
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🔋 KLIKKET PÅ NY BLÅMARKØR:', station.name);
            
            // Vis rute til denne ladestasjonen først
            showRouteToChargingStation(station);
            
            // Deretter åpne dialog for ladeprosent
            setSelectedChargingStation(station);
            setShowChargingDialog(true);
          });

      // Hent live data for stasjonen, fallback til original data
      const liveData = liveStationData[station.id] || station;
      console.log('🔄 Creating new station popup for', station.name, '- Live data:', liveData);
      
      // Beregn batteriprosent ved ankomst basert på distanse langs ruten
      const distanceToStation = station.distanceAlongRoute || 0;
      const currentBatteryPercentage = routeData?.batteryPercentage || 80;
      const carRange = selectedCar?.range || 450;
      const batteryUsedPercent = (distanceToStation / carRange) * 100;
      const arrivalBatteryPercent = Math.max(currentBatteryPercentage - batteryUsedPercent, 0);

      const popup = new mapboxgl.Popup({
        maxWidth: '320px',
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4;">
          <div style="background: linear-gradient(135deg, #0066ff, #00aaff); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
            <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🔋 ${liveData.name}</h4>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${liveData.location}</p>
            <div style="margin-top: 6px;">
              <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔴 LIVE DATA</span>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px; color: #0066ff; font-weight: 600;">🔋 Batteri ved ankomst: ~${arrivalBatteryPercent.toFixed(0)}%</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
              <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${liveData.power || 'N/A'}</div>
            </div>
            <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
              <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${liveData.cost || 'N/A'} kr/kWh</div>
            </div>
            <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
              <div style="color: ${(liveData.available || 0) > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${liveData.available || 0}/${liveData.total || 0}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button 
              onclick="window.showRouteToStation && window.showRouteToStation('${station.id}')"
              style="
                background: #22c55e; 
                color: white; 
                border: none; 
                padding: 10px 12px; 
                border-radius: 6px; 
                font-size: 13px; 
                font-weight: 600; 
                cursor: pointer; 
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#16a34a'"
              onmouseout="this.style.background='#22c55e'"
            >
              🗺️ Vis rute
            </button>
            <button 
              onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', ${station.distanceAlongRoute || 0}, ${arrivalBatteryPercent.toFixed(0)})"
              style="
                background: #0066ff; 
                color: white; 
                border: none; 
                padding: 10px 12px; 
                border-radius: 6px; 
                font-size: 13px; 
                font-weight: 600; 
                cursor: pointer; 
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#0052cc'"
              onmouseout="this.style.background='#0066ff'"
            >
              ⚡ Lading
            </button>
          </div>
        </div>
      `);
      
      // Legg til event listeners for input-feltet etter at popup er opprettet
      popup.on('open', () => {
        setTimeout(() => {
          const inputElement = document.getElementById(`chargePercent_${station.id}`) as HTMLInputElement;
          const buttonElement = document.querySelector(`button[onclick*="${station.id}"]`) as HTMLButtonElement;
          
          if (inputElement) {
            console.log('🔧 Setting up input events for station:', station.id);
            
            // Gjør input-feltet klikkbart og editerbart
            inputElement.addEventListener('click', (e) => {
              e.stopPropagation();
              inputElement.focus();
              inputElement.select();
              console.log('📝 Input field focused and selected');
            });
            
            inputElement.addEventListener('focus', (e) => {
              e.stopPropagation();
              inputElement.style.borderColor = '#0052cc';
              inputElement.style.boxShadow = '0 0 0 3px rgba(0,102,255,0.2)';
              console.log('📝 Input field focused');
            });
            
            inputElement.addEventListener('blur', () => {
              inputElement.style.borderColor = '#0066ff';
              inputElement.style.boxShadow = 'none';
            });
            
            inputElement.addEventListener('input', (e) => {
              console.log('📝 Input value changed to:', (e.target as HTMLInputElement).value);
            });
            
            // Hindre at popup lukkes når vi klikker på input
            inputElement.addEventListener('mousedown', (e) => {
              e.stopPropagation();
            });
          }
          
          if (buttonElement) {
            buttonElement.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log('🎯 Button clicked for station:', station.id);
            });
          }
        }, 100);
      });

      console.log('✅ New station popup created for', station.name, 'with live data:', {
        power: liveData.power,
        cost: liveData.cost,
        available: liveData.available,
        total: liveData.total
      });

      new mapboxgl.Marker(el)
        .setLngLat([station.longitude, station.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });
    
    setChargingProgress(prev => prev + 1);
    setShowChargingDialog(false);
    
    toast({
      title: `Ladet til ${selectedBatteryPercent}%! 🔋`,
      description: `${nextStations.length} nye kritiske punkter vist på kartet.`,
    });
  };

  // Funksjon for å vise rute til ladestasjon
  const showRouteToChargingStation = async (station: ChargingStation) => {
    if (!map.current || !accessToken) return;
    
    console.log('🗺️ Viser rute til ladestasjon:', station.name);
    
    try {
      // Hent koordinater for start (Oslo som standard hvis routeData ikke har koordinater)
      const startCoords = cityCoordinates[routeData.from.toLowerCase()] || [10.7522, 59.9139];
      const endCoords = [station.longitude, station.latitude];
      
      console.log('📍 Start koordinater:', startCoords);
      console.log('📍 Slutt koordinater (ladestasjon):', endCoords);
      
      // Beregn rute til ladestasjonen
      const directionsURL = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&access_token=${accessToken}&alternatives=false&continue_straight=false&steps=true&annotations=duration&overview=full`;
      
      const response = await fetch(directionsURL);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Fjern eksisterende rute til ladestasjon hvis den finnes
        if (map.current.getSource('route-to-station')) {
          map.current.removeLayer('route-to-station');
          map.current.removeSource('route-to-station');
        }
        
        // Legg til ny rute til ladestasjonen (grønn farge for å skille fra hovedruten)
        map.current.addSource('route-to-station', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });
        
        map.current.addLayer({
          id: 'route-to-station',
          type: 'line',
          source: 'route-to-station',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#22c55e', // Grønn farge for rute til ladestasjon
            'line-width': 6,
            'line-opacity': 0.8
          }
        });
        
        // Fokuser kartet på ruten til ladestasjonen
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds: any, coord: any) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
        
        // Vis toast med informasjon om ruten
        const distance = (route.distance / 1000).toFixed(1);
        const duration = Math.round(route.duration / 60);
        
        toast({
          title: `🗺️ Rute til ${station.name}`,
          description: `Distanse: ${distance} km • Kjøretid: ${duration} min`,
        });
        
        console.log('✅ Rute til ladestasjon vist på kartet');
      } else {
        throw new Error('Ingen rute funnet');
      }
      
    } catch (error) {
      console.error('❌ Feil ved beregning av rute til ladestasjon:', error);
      toast({
        title: "❌ Kunne ikke vise rute",
        description: "Klarte ikke å beregne rute til ladestasjonen.",
        variant: "destructive"
      });
    }
  };

  // Mapbox token henting
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('🔑 Fetching Mapbox token...');
        const { data, error } = await supabase.functions.invoke('mapbox-token');
        if (error) {
          console.error('❌ Mapbox token error:', error);
          throw error;
        }
        console.log('✅ Mapbox token fetched successfully');
        setAccessToken(data.token);
      } catch (error) {
        console.error('❌ Error fetching Mapbox token:', error);
        setError('Kunne ikke hente karttoken');
      }
    };

    fetchMapboxToken();
  }, []);

  // Global funksjon for å åpne charging modal
  useEffect(() => {
    (window as any).openChargingModal = (stationId: string, stationName: string, distance: number, arrivalBattery: number) => {
      console.log('🔧 Opening charging modal for station:', stationName);
      console.log('📊 Modal data:', { stationId, stationName, distance, arrivalBattery });
      
      // Debug hvis distance er 0 eller ugyldig
      if (!distance && distance !== 0) {
        console.warn('⚠️ Warning: Distance is undefined/null for station:', stationName);
      }
      
      setChargingModal({
        isOpen: true,
        stationId,
        stationName,
        distance: distance || 0, // Sikre at vi aldri har undefined
        arrivalBattery
      });
      const defaultValue = Math.max(arrivalBattery, 80).toString();
      console.log('📝 Setting default input value to:', defaultValue);
      setChargePercentInput(defaultValue);
    };

    // Global funksjon for å vise rute til stasjon
    (window as any).showRouteToStation = (stationId: string) => {
      console.log('🗺️ Global function called to show route to station:', stationId);
      const station = chargingStations.find(s => s.id === stationId);
      if (station) {
        showRouteToChargingStation(station);
      } else {
        console.warn('❌ Station not found:', stationId);
      }
    };

    return () => {
      delete (window as any).openChargingModal;
      delete (window as any).showRouteToStation;
    };
  }, [chargingStations]);

  // Funksjon for å beregne neste kritiske punkt
  const calculateNextPoint = () => {
    console.log('🎯🎯🎯 calculateNextPoint STARTET! 🎯🎯🎯');
    console.log('🎯 calculateNextPoint function called');
    console.log('📝 Current input value:', chargePercentInput);
    console.log('📝 Modal data:', chargingModal);
    
    alert('🎯 calculateNextPoint ble kalt! Sjekk konsollen for debugging...');
    
    // Lukk modalen med en gang
    setChargingModal({ isOpen: false, stationId: '', stationName: '', distance: 0, arrivalBattery: 0 });
    
    const chargePercent = parseInt(chargePercentInput);
    console.log('📊 Parsed charge percent:', chargePercent);
    
    if (isNaN(chargePercent) || chargePercent < chargingModal.arrivalBattery || chargePercent > 100) {
      console.log('❌ Invalid charge percent detected');
      toast({
        title: "❌ Ugyldig ladeprosent",
        description: `Vennligst skriv inn en prosent mellom ${chargingModal.arrivalBattery} og 100.`,
        variant: "destructive"
      });
      return;
    }

    if (!routeData || !selectedCar) {
      console.log('❌ Missing routeData or selectedCar');
      toast({
        title: "❌ Mangler rutedata",
        description: "Vennligst planlegg en rute først.",
        variant: "destructive"
      });
      return;
    }

    // KRITISK DEBUG: Sjekk at chargingStations har distanceAlongRoute
    const stationsWithDistance = chargingStations.filter(s => s.distanceAlongRoute !== undefined);
    console.log('🔍 KRITISK DEBUG:');
    console.log('- Total stasjoner:', chargingStations.length);
    console.log('- Stasjoner med distanceAlongRoute:', stationsWithDistance.length);
    console.log('- Første 3 med distanceAlongRoute:', stationsWithDistance.slice(0, 3).map(s => ({ 
      name: s.name, 
      distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km' 
    })));
    
    if (stationsWithDistance.length === 0) {
      console.log('❌ INGEN STASJONER HAR distanceAlongRoute - dette er problemet!');
      toast({
        title: "❌ Teknisk feil",
        description: "Rutedata er ikke beregnet riktig. Planlegg ruten på nytt.",
        variant: "destructive"
      });
      return;
    }

    const currentDistance = chargingModal.distance;
    console.log('📍 Using modal distance:', currentDistance);
    
    if (currentDistance === undefined || currentDistance === null) {
      console.log('❌ No modal distance available');
      toast({
        title: "❌ Mangler distansedata",
        description: "Kunne ikke bestemme posisjonen langs ruten. Prøv å planlegge ruten på nytt.",
        variant: "destructive"
      });
      return;
    }

    // Beregn hvor langt bilen kan kjøre med ny ladeprosent
    const carRange = selectedCar.range;
    const criticalLevel = 10; // Når batteriet når 10%
    const usableRange = (carRange * (chargePercent - criticalLevel)) / 100;
    const nextCriticalDistance = currentDistance + usableRange;

    console.log('🎯 Beregning details:', {
      currentDistance,
      chargePercent,
      carRange,
      usableRange,
      nextCriticalDistance
    });

    console.log('🎯 Beregner neste kritiske punkt:', {
      stationId: chargingModal.stationId,
      currentDistance: chargingModal.distance,
      chargePercent,
      carRange,
      usableRange,
      nextCriticalDistance
    });

    // Fjern eksisterende blå markører (gamle kritiske punkter)
    if (map.current) {
      const oldMarkers = document.querySelectorAll('.blue-charging-marker');
      console.log('🧹 Removing', oldMarkers.length, 'old blue markers (NOT progressive ones)');
      oldMarkers.forEach(marker => marker.remove());
    }

    // ROBUST STRATEGI: Finn alltid de 3 nærmeste stasjonene fremover på ruten
    let nearbyStations: ChargingStation[] = [];
    
    // Finn stasjoner i området rundt hvor batteriet blir kritisk
    const searchRange = 100; // km før og etter kritisk punkt
    const stationsAhead = chargingStations
      .filter(s => s.distanceAlongRoute && 
               s.distanceAlongRoute > currentDistance && 
               s.distanceAlongRoute >= (nextCriticalDistance - searchRange) &&
               s.distanceAlongRoute <= (nextCriticalDistance + searchRange))
      .sort((a, b) => Math.abs(a.distanceAlongRoute! - nextCriticalDistance) - Math.abs(b.distanceAlongRoute! - nextCriticalDistance));
    
    console.log(`🔍 Totalt ${stationsAhead.length} stasjoner fremover fra kritisk punkt ${nextCriticalDistance.toFixed(1)} km`);
    
    if (stationsAhead.length === 0) {
      console.log('❌ INGEN stasjoner fremover på ruten funnet!');
      toast({
        title: "❌ Ingen stasjoner funnet",
        description: "Ingen ladestasjoner funnet fremover på ruten.",
        variant: "destructive"
      });
      return;
    }
    
    // Ta de 3 nærmeste stasjonene fremover
    nearbyStations = stationsAhead.slice(0, 3);
    
    console.log('📍 Fant nærmeste stasjoner fremover:', nearbyStations.map(s => ({
      name: s.name,
      distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km',
      gapFromIdeal: (s.distanceAlongRoute! - nextCriticalDistance).toFixed(1) + 'km'
    })));

    console.log('🔍 Found', nearbyStations.length, 'nearby stations for next critical point at', nextCriticalDistance.toFixed(1), 'km');
    
    // Debug: vis alle stasjoner som ble funnet
    if (nearbyStations.length > 0) {
      console.log('🔍 Stasjoner funnet:', nearbyStations.map(s => ({
        name: s.name,
        distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km',
        isAfterCurrent: s.distanceAlongRoute! > currentDistance
      })));
    } else {
      console.log('❌ INGEN STASJONER FUNNET - debugging nærmeste stasjoner:');
      const allWithDistance = chargingStations
        .filter(s => s.distanceAlongRoute && s.distanceAlongRoute > currentDistance)
        .sort((a, b) => a.distanceAlongRoute! - b.distanceAlongRoute!)
        .slice(0, 5);
      console.log('🔍 Nærmeste 5 stasjoner fremover:', allWithDistance.map(s => ({
        name: s.name,
        distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km',
        distanceFromTarget: Math.abs(s.distanceAlongRoute! - nextCriticalDistance).toFixed(1) + 'km'
      })));
    }

    // Hvis ingen stasjoner er funnet, foreslå å lade mer
    if (nearbyStations.length === 0) {
      console.log('❌ Ingen stasjoner funnet innenfor rekkevidde');
      
      // Finn neste stasjon fremover på ruten
      const nextStationsAhead = chargingStations
        .filter(station => station.distanceAlongRoute && station.distanceAlongRoute > currentDistance)
        .sort((a, b) => a.distanceAlongRoute! - b.distanceAlongRoute!)
        .slice(0, 3);

      if (nextStationsAhead.length > 0) {
        const nextStation = nextStationsAhead[0];
        const distanceToNext = nextStation.distanceAlongRoute! - currentDistance;
        const requiredRange = distanceToNext + 50; // 50km margin
        const requiredBatteryPercent = Math.ceil((requiredRange / carRange * 100) + criticalLevel);
        
        console.log('📍 Neste stasjon:', nextStation.name, 'på', nextStation.distanceAlongRoute?.toFixed(1), 'km');
        console.log('📏 Distanse til neste:', distanceToNext.toFixed(1), 'km');
        console.log('🔋 Foreslått ladeprosent:', requiredBatteryPercent, '%');
        
        toast({
          title: "⚡ Ingen stasjoner innenfor rekkevidde",
          description: `Neste stasjon er ${nextStation.name} på ${nextStation.distanceAlongRoute?.toFixed(1)} km. Du trenger å lade til minst ${Math.min(requiredBatteryPercent, 100)}% for å nå dit.`,
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Ingen stasjoner funnet",
          description: "Ingen ladestasjoner funnet fremover på ruten. Vurder en alternativ rute.",
          variant: "destructive"
        });
      }
      return;
    }

    // FALLBACK: Hvis ingen stasjoner funnet, bruk de nærmeste fremover
    if (nearbyStations.length === 0) {
      console.log('🔄 FALLBACK: Bruker nærmeste stasjoner fremover på ruten');
      const stationsAhead = chargingStations
        .filter(s => s.distanceAlongRoute && s.distanceAlongRoute > currentDistance)
        .sort((a, b) => a.distanceAlongRoute! - b.distanceAlongRoute!)
        .slice(0, 3);
        
      console.log('📍 Fallback fant', stationsAhead.length, 'stasjoner fremover:', stationsAhead.map(s => ({
        name: s.name,
        distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km'
      })));
      
      nearbyStations = stationsAhead;
    }

    if (nearbyStations.length > 0 && map.current) {
      console.log('🗺️ KRITISK DEBUG: map.current eksisterer:', !!map.current);
      console.log('🗺️ KRITISK DEBUG: map.current type:', typeof map.current);
      // Sorter stasjoner etter kvalitet og avstand
      const sortedStations = nearbyStations
        .map(station => ({
          ...station,
          distanceFromTarget: Math.abs(station.distanceAlongRoute! - nextCriticalDistance),
          qualityScore: 
            (station.available / station.total * 30) + // Tilgjengelighet (30%)
            (station.fastCharger ? 40 : 20) +          // Hurtiglading (40% vs 20%)
            (station.cost <= 5.0 ? 20 : 10) +         // Rimelig pris (20% vs 10%)
            (station.power.includes('250') ? 10 : 5)   // Høy effekt (10% vs 5%)
        }))
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 3); // Ta de 3 beste

      console.log('✅ Fant og sorterte stasjoner:', sortedStations.map(s => ({ 
        name: s.name, 
        score: s.qualityScore.toFixed(1),
        distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km'
      })));

      sortedStations.forEach((station, index) => {
        // Beregn batteriprosent ved ankomst til denne nye stasjonen
        const distanceToNewStation = station.distanceAlongRoute! - currentDistance;
        const batteryUsed = (distanceToNewStation / carRange) * 100;
        const arrivalBatteryPercent = Math.max(chargePercent - batteryUsed, 0);

        console.log(`📍 Creating new blue marker for ${station.name} at ${station.distanceAlongRoute?.toFixed(1)}km (${arrivalBatteryPercent.toFixed(1)}% battery on arrival)`);
        console.log('🔵 PROGRESSIVE BLÅ MARKØR STASJON:', station);

        // Lag blå markør for nytt kritisk punkt
        const el = document.createElement('div');
        el.className = 'progressive-charging-marker';
        el.style.cssText = `
          background: linear-gradient(135deg, #0066ff, #00aaff);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          z-index: 100;
          box-shadow: 0 0 20px rgba(0, 102, 255, 0.8), 0 0 40px rgba(0, 170, 255, 0.4);
          animation: pulse 2s infinite;
        `;
        el.innerHTML = '🔋';

        console.log('🟢 BLÅ MARKØR ELEMENT LAGET:', el);

        // Opprett Mapbox markør og legg til på kartet
        const blueMarker = new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .addTo(map.current!);

        console.log('🟢 BLÅ MARKØR LAGT TIL PÅ KARTET!', blueMarker);
        
        // Send alle optimerte stasjoner til ladestasjonkartet
        sendStationsToChargingMap(optimizedStations, station);

        // Click handler for ny blå markør
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('🔋 KLIKKET PÅ NY BLÅMARKØR:', station.name);
          
          // Vis rute til denne ladestasjonen først
          showRouteToChargingStation(station);
          
          // Deretter åpne dialog for ladeprosent
          setSelectedChargingStation(station);
          setShowChargingDialog(true);
        });

        // Lag popup for den nye blå markøren
        const popup = new mapboxgl.Popup({
          maxWidth: '320px',
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4;">
            <div style="background: linear-gradient(135deg, #0066ff, #00aaff); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
              <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🎯 ${station.name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${station.location}</p>
              <div style="margin-top: 6px;">
                <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔴 NYTT KRITISK PUNKT</span>
              </div>
            </div>
            
            <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 13px; color: #0066ff; font-weight: 600;">🔋 Batteri ved ankomst: ~${arrivalBatteryPercent.toFixed(0)}%</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.power || 'N/A'}</div>
              </div>
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.cost || 'N/A'} kr/kWh</div>
              </div>
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
                <div style="color: ${station.available > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${station.available}/${station.total}</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button 
                onclick="window.showRouteToStation && window.showRouteToStation('${station.id}')"
                style="
                  background: #22c55e; 
                  color: white; 
                  border: none; 
                  padding: 10px 12px; 
                  border-radius: 6px; 
                  font-size: 13px; 
                  font-weight: 600; 
                  cursor: pointer; 
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='#16a34a'"
                onmouseout="this.style.background='#22c55e'"
              >
                🗺️ Vis rute
              </button>
              <button 
                onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', ${station.distanceAlongRoute || 0}, ${arrivalBatteryPercent.toFixed(0)})"
                style="
                  background: #0066ff; 
                  color: white; 
                  border: none; 
                  padding: 10px 12px; 
                  border-radius: 6px; 
                  font-size: 13px; 
                  font-weight: 600; 
                  cursor: pointer; 
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='#0052cc'"
                onmouseout="this.style.background='#0066ff'"
              >
                ⚡ Lading
              </button>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
          
        console.log('🟢 BLÅ MARKØR LAGT TIL PÅ KARTET!', marker);
        console.log('🟢 Markør posisjon:', [station.longitude, station.latitude]);
        console.log('🟢 Markør element:', el);
        console.log('🟢 Map objektet:', map.current);
        
        // Legg til en ekstra visuell indikator
        setTimeout(() => {
          console.log('🔍 Sjekker om markør er synlig etter 1 sekund...');
          const markerElement = document.querySelector('.progressive-charging-marker');
          console.log('🔍 Fant progressive-charging-marker element:', markerElement);
        }, 1000);
      });

      toast({
        title: `🎯 Neste kritisk punkt beregnet!`,
        description: `Med ${chargePercent}% lading vil batteriet nå 10% etter ${usableRange.toFixed(0)}km. ${sortedStations.length} stasjon(er) vist på kartet.`,
      });
    } else {
      toast({
        title: "⚠️ Ingen stasjoner funnet",
        description: `Ingen ladestasjoner funnet nær det beregnede punktet (${nextCriticalDistance.toFixed(0)}km fra start).`,
        variant: "destructive"
      });
    }
  };

  // Global funksjon for å oppdatere neste ladepunkt (gammel funksjon, beholdes for kompatibilitet)
  useEffect(() => {
    (window as any).updateNextChargingPoint = (stationId: string, currentDistance: number) => {
      // Videresend til ny modal-funksjon
      const station = chargingStations.find(s => s.id === stationId);
      if (station) {
        const arrivalBatteryPercent = 50; // Standard fallback
        (window as any).openChargingModal(stationId, station.name, currentDistance, arrivalBatteryPercent);
      }
    };

    return () => {
      delete (window as any).updateNextChargingPoint;
    };
  }, [chargingStations]);

  // Realtime oppdateringer av ladestasjoner
  useEffect(() => {
    console.log('🔄 Setting up realtime charging station updates...');
    const channel = supabase
      .channel('charging-stations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'charging_stations'
        },
        (payload) => {
          console.log('🔄 LIVE UPDATE:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedStation = {
              id: payload.new.id,
              name: payload.new.name,
              location: payload.new.location,
              latitude: Number(payload.new.latitude),
              longitude: Number(payload.new.longitude),
              available: payload.new.available,
              total: payload.new.total,
              fastCharger: payload.new.fast_charger,
              power: payload.new.power,
              cost: Number(payload.new.cost)
            };
            
            console.log('🔄 Live update received:', updatedStation);
            console.log('🔄 Current live data before update:', liveStationData);
            
            // Oppdater live data
            setLiveStationData(prev => {
              const newData = {
                ...prev,
                [updatedStation.id]: updatedStation
              };
              console.log('🔄 New live data after update:', newData);
              return newData;
            });
            
            // Oppdater hovedlisten med ladestasjoner
            setChargingStations(prev => 
              prev.map(station => 
                station.id === updatedStation.id ? { ...station, ...updatedStation } : station
              )
            );
            
            console.log('✅ Updated station live data:', updatedStation.name, 'Available:', updatedStation.available, 'Cost:', updatedStation.cost, 'Power:', updatedStation.power);
            
            toast({
              title: "🔄 Live oppdatering",
              description: `${updatedStation.name}: ${updatedStation.available}/${updatedStation.total} ledige, ${updatedStation.cost} kr/kWh`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Initialisering av kart
  const initializeMap = async () => {
    console.log('🗺️ initializeMap called, mapContainer:', !!mapContainer.current, 'accessToken:', !!accessToken);
    if (!mapContainer.current || !accessToken) {
      console.log('🚫 Missing requirements - mapContainer:', !!mapContainer.current, 'accessToken:', !!accessToken);
      return;
    }

    try {
      console.log('🚀 Starting map initialization...');
      mapboxgl.accessToken = accessToken;
      
      if (map.current) {
        console.log('🧹 Removing existing map...');
        map.current.remove();
      }

      console.log('🏗️ Creating new map instance...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellitt med veier
        center: [10.7522, 59.9139], // Oslo som standard
        zoom: 6,
        pitch: 30,
      });

      console.log('🧭 Adding navigation controls...');
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ Kart lastet og klar!');
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
      });

      console.log('🎯 Map initialization completed successfully!');

    } catch (error) {
      console.error('Feil ved initialisering av kart:', error);
      setError('Kunne ikke initialisere kartet');
    }
  };

  // Cleanup funksjon
  const cleanupMap = () => {
    if (map.current) {
      try {
        const sources = map.current.getStyle()?.sources || {};
        Object.keys(sources).forEach(sourceId => {
          if (sourceId.startsWith('route') || sourceId.startsWith('station')) {
            const layers = map.current!.getStyle()?.layers || [];
            layers.forEach(layer => {
              if (layer.source === sourceId) {
                map.current!.removeLayer(layer.id);
              }
            });
            map.current!.removeSource(sourceId);
          }
        });
      } catch (error) {
        console.log('Cleanup feil (ikke kritisk):', error);
      }
    }
  };

  // Funksjon for å konvertere stedsnavn til koordinater (kun Norge)
  const getCoordinatesForPlace = async (place: string): Promise<[number, number] | null> => {
    const lowerPlace = place.toLowerCase().trim();
    
    if (cityCoordinates[lowerPlace]) {
      console.log('🇳🇴 Fant norsk by i cache:', place, '->', cityCoordinates[lowerPlace]);
      return cityCoordinates[lowerPlace];
    }

    try {
      // Legg til strenge Norge-begrensninger i geocoding
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${accessToken}&country=NO&limit=1&proximity=10.7522,59.9139&bbox=4.65,57.93,31.29,71.18`;
      console.log('🇳🇴 Geocoding kun i Norge for:', place);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        console.log('🇳🇴 Fant norsk koordinat:', place, '->', [lng, lat]);
        return [lng, lat];
      } else {
        console.log('🚫 Ingen norske resultater for:', place);
      }
    } catch (error) {
      console.error('❌ Geocoding feil:', error);
    }
    
  return null;
};

// Funksjon for å bestemme om ruten skal gå via Trondheim
const checkIfShouldGoViaTrondheim = (startCoords: [number, number], endCoords: [number, number]): boolean => {
  const [startLng, startLat] = startCoords;
  const [endLng, endLat] = endCoords;
  
  // Trondheim koordinater
  const trondheimLat = 63.4305;
  
  // Sjekk om det er en lang nord-sør rute
  const latDifference = Math.abs(endLat - startLat);
  const isLongRoute = latDifference > 5; // Mer enn 5 grader breddegrad
  
  // Sjekk om en av punktene er nord for Trondheim og den andre sør for Trondheim
  const oneNorthOneSouth = (startLat > trondheimLat && endLat < trondheimLat) || 
                          (startLat < trondheimLat && endLat > trondheimLat);
  
  // Sjekk om ruten er innenfor Norge (rough check)
  const isWithinNorway = startLng >= 4.65 && startLng <= 31.29 && 
                        endLng >= 4.65 && endLng <= 31.29 &&
                        startLat >= 57.93 && startLat <= 71.18 &&
                        endLat >= 57.93 && endLat <= 71.18;
  
  const shouldUseVia = isLongRoute && oneNorthOneSouth && isWithinNorway;
  
  console.log('🛣️ Via Trondheim sjekk:', {
    isLongRoute,
    oneNorthOneSouth,
    isWithinNorway,
    shouldUseVia,
    startLat: startLat.toFixed(2),
    endLat: endLat.toFixed(2),
    trondheimLat: trondheimLat.toFixed(2)
  });
  
  return shouldUseVia;
};

// Rask Mapbox Directions API funksjon for parallellisering
const fetchDirectionsData = async (startCoords: [number, number], endCoords: [number, number], routeType: string, viaCity?: string) => {
  // Sjekk om vi trenger å gå via Trondheim for lange ruter nord-sør
  const waypoints = [startCoords];
  
  // Først sjekk om bruker har spesifisert via-punkt
  if (viaCity) {
    const viaCoords = await getCoordinatesForPlace(viaCity);
    if (viaCoords) {
      console.log('🛣️ Legger til bruker-spesifisert via-punkt:', viaCity, viaCoords);
      waypoints.push(viaCoords);
    } else {
      console.log('⚠️ Kunne ikke finne koordinater for via-punkt:', viaCity);
    }
  } else {
    // Bare bruk automatisk Trondheim via-punkt hvis bruker ikke har spesifisert noe
    const shouldGoViaTrondheim = checkIfShouldGoViaTrondheim(startCoords, endCoords);
    if (shouldGoViaTrondheim) {
      console.log('🛣️ Legger til Trondheim som via-punkt for optimal rute gjennom Norge');
      waypoints.push(cityCoordinates['trondheim']);
    }
  }
  
  waypoints.push(endCoords);
  const coordinates = waypoints.map(coord => coord.join(',')).join(';');
  
  // Velg riktig Mapbox profil og parametre basert på rutetype
  let mapboxProfile = 'driving';
  let routeParams = `geometries=geojson&access_token=${accessToken}&alternatives=true&continue_straight=false`;
  
  switch (routeType) {
    case 'fastest':
      mapboxProfile = 'driving-traffic'; // Raskeste med trafikk
      routeParams += '&steps=true&annotations=duration&overview=full';
      break;
    case 'shortest':
      mapboxProfile = 'driving'; // Standard driving
      routeParams += '&steps=true&annotations=distance&overview=full&exclude=ferry'; // Unngå ferge for kortere rute
      break;
    case 'eco':
      mapboxProfile = 'driving'; // Eco-vennlig
      routeParams += '&steps=true&annotations=duration,distance&overview=full&avoid_speed_limits=true'; // Unngå høye hastigheter
      break;
    default:
      mapboxProfile = 'driving';
      routeParams += '&steps=true&alternatives=true';
  }
  
  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${mapboxProfile}/${coordinates}?${routeParams}`;
  console.log('🚀 Rask Mapbox API-kall for', routeType);
  
  const directionsResponse = await fetch(directionsUrl);
  const directionsData = await directionsResponse.json();
  
  if (directionsResponse.status !== 200) {
    throw new Error(`Mapbox API feil: ${directionsData.message || directionsData.error || 'Ukjent feil'}`);
  }
  
  return { ...directionsData, profile: mapboxProfile };
};

  // Throttled updateMapRoute for å forhindre for mange API-kall
  const updateMapRoute = async (routeType: string = 'fastest') => {
    // Clear previous timeout
    if (routeUpdateTimeoutRef.current) {
      clearTimeout(routeUpdateTimeoutRef.current);
    }

    // Redusert debounce fra 500ms til 100ms for raskere respons
    routeUpdateTimeoutRef.current = setTimeout(async () => {
      if (!map.current || !accessToken || !routeData.from || !routeData.to || loading) {
        return;
      }

    setLoading(true);
    setError(null);

    try {
      const startCoords = await getCoordinatesForPlace(routeData.from);
      const endCoords = await getCoordinatesForPlace(routeData.to);

      if (!startCoords || !endCoords) {
        throw new Error('Kunne ikke finne koordinater for start eller slutt');
      }

      // RASK PARALLELL API-kall
      const [weatherData, directionsData] = await Promise.all([
        // Hent værdata parallelt
        fetchWeatherData(startCoords, endCoords),
        // Hent rute parallelt
        fetchDirectionsData(startCoords, endCoords, routeType, routeData.via)
      ]);
      
      // Rask prosessering av rute-data - directionsData already contains the processed route
      
      // Velg riktig Mapbox profil og parametre basert på rutetype
      let mapboxProfile = 'driving';
      let routeParams = `geometries=geojson&access_token=${accessToken}&alternatives=true&continue_straight=false`;
      
      switch (routeType) {
        case 'fastest':
          mapboxProfile = 'driving-traffic'; // Raskeste med trafikk
          routeParams += '&steps=true&annotations=duration&overview=full';
          break;
        case 'shortest':
          mapboxProfile = 'driving'; // Standard driving
          routeParams += '&steps=true&annotations=distance&overview=full&exclude=ferry'; // Unngå ferge for kortere rute
          break;
        case 'eco':
          mapboxProfile = 'driving'; // Eco-vennlig
          routeParams += '&steps=true&annotations=duration,distance&overview=full&avoid_speed_limits=true'; // Unngå høye hastigheter
          break;
        default:
          mapboxProfile = 'driving';
          routeParams += '&steps=true&alternatives=true';
      }
      
      console.log('🎯 Rutetype:', routeType, '| Profil:', mapboxProfile);
      
      console.log('🎯 Rutetype:', routeType);
      
      if (!directionsData.routes || directionsData.routes.length === 0) {
        throw new Error('Ingen rute funnet mellom de valgte punktene');
      }

      // Velg riktig rute basert på type
      let selectedRoute = directionsData.routes[0];
      
      if (directionsData.routes.length > 1) {
        switch (routeType) {
          case 'fastest':
            selectedRoute = directionsData.routes.reduce((fastest, current) => 
              current.duration < fastest.duration ? current : fastest
            );
            break;
          case 'shortest':
            selectedRoute = directionsData.routes.reduce((shortest, current) => 
              current.distance < shortest.distance ? current : shortest
            );
            break;
          case 'eco':
            const fastest = directionsData.routes.reduce((fastest, current) => 
              current.duration < fastest.duration ? current : fastest
            );
            selectedRoute = directionsData.routes.find(route => route !== fastest) || directionsData.routes[1] || fastest;
            break;
        }
      }

      const route = selectedRoute;
      const routeDistance = route.distance / 1000; // Konverter til km
      const routeDuration = route.duration / 3600; // Konverter til timer

      // Lagre current route for re-kalkulering
      setCurrentRoute(route);
      console.log('💾 SATTE CURRENT ROUTE:', {
        distance: route.distance,
        duration: route.duration,
        distanceKm: routeDistance,
        durationHours: routeDuration
      });

      // STARTER MED 0 KR OG 0 MIN - BEREGNES KUN VED VALGT LADING
      const startBatteryPercent = routeData.batteryPercentage || 80; 
      
      const realisticAnalysis = {
        totalDistance: routeDistance,
        totalTime: routeDuration, // KUN KJØRETID, INGEN LADETID
        totalCost: 0, // STARTER PÅ 0 KR
        chargingTime: 0, // STARTER PÅ 0 MINUTTER
        co2Saved: Math.round(routeDistance * 0.13),
        efficiency: startBatteryPercent > 50 ? 0.88 : 0.83,
        weather: undefined
      };
      
      console.log('🚗 RUTEANALYSE STARTET MED 0 KR OG 0 MIN LADING:', {
        distanse: routeDistance + ' km',
        kjøretid: routeDuration.toFixed(1) + ' timer',
        kostnad: '0 kr',
        ladetid: '0 min',
        melding: 'Klikk blå markør for å beregne lading'
      });
      
      setRouteAnalysis(realisticAnalysis);
      onRouteAnalysisUpdate?.(realisticAnalysis);
      console.log('✅ SATTE REALISTISK ANALYSE:', realisticAnalysis);

      console.log('🎯 Valgt rute detaljer:', { 
        type: routeType, 
        distance: routeDistance + 'km', 
        duration: routeDuration + 't',
        totalRoutes: directionsData.routes.length 
      });

      console.log('🚀 FORTSETTER TIL CLEANUP OG ANALYSE...');

      // FØRST: Cleanup eksisterende rute og markører GRUNDIG
      console.log('🧹 GRUNDIG CLEANUP - fjerner alt eksisterende innhold...');
      
      // Fjern alle markører UNNTATT blå markører (progressive-charging-marker og blue-critical-point-marker)
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      console.log('🧹 CLEANUP: Fant', existingMarkers.length, 'markører totalt');
      
      let removedCount = 0;
      let preservedCount = 0;
      
      existingMarkers.forEach(marker => {
        const hasProgressiveMarker = marker.querySelector('.progressive-charging-marker');
        const hasCriticalPointMarker = marker.querySelector('.blue-critical-point-marker');
        
        if (hasProgressiveMarker || hasCriticalPointMarker) {
          console.log('🔵 BEVARER blå markør:', hasProgressiveMarker ? 'progressive' : 'critical-point');
          preservedCount++;
        } else {
          marker.remove();
          removedCount++;
        }
      });
      
      console.log('🧹 CLEANUP RESULTAT: Fjernet', removedCount, 'markører, bevarte', preservedCount, 'blå markører');
      
      // Fjern rute-lag og kilder
      try {
        if (map.current!.getLayer('route')) {
          map.current!.removeLayer('route');
          console.log('✅ Fjernet route layer');
        }
      } catch (e) { console.log('Route layer finnes ikke'); }
      
      try {
        if (map.current!.getSource('route')) {
          map.current!.removeSource('route');
          console.log('✅ Fjernet route source');
        }
      } catch (e) { console.log('Route source finnes ikke'); }

      // Vent litt før vi legger til ny rute
      await new Promise(resolve => setTimeout(resolve, 100));

      // DERETTER: Legg til ny rute
      console.log('➕ Legger til ny route source med farge:', getRouteColor(routeType));
      if (map.current!.getSource('route')) {
        map.current!.removeSource('route');
      }

      map.current!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        }
      });

      if (map.current!.getLayer('route')) {
        map.current!.removeLayer('route');
      }

      map.current!.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': getRouteColor(routeType),
          'line-width': 6,
          'line-opacity': 0.8
        }
      });

      // Markører er allerede fjernet i cleanup over
      console.log('✅ Cleanup allerede utført - starter på nytt...');

      // Legg til start markør
      console.log('📍 Legger til start markør...');
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat(startCoords)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Start:</strong> ${routeData.from}`))
        .addTo(map.current!);

      // Legg til slutt markør
      console.log('📍 Legger til slutt markør...');
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(endCoords)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Slutt:</strong> ${routeData.to}`))
        .addTo(map.current!);

      // Optimaliser ladestasjoner basert på bilens rekkevidde
      console.log('🔧 Optimaliserer ladestasjoner...');
      console.log('📊 Input til optimalisering:', {
        routeCoordinates: route.geometry.coordinates.length + ' punkter',
        routeDistance: routeDistance + ' km',
        batteryPercentage: routeData.batteryPercentage + '%',
        chargingStationsCount: chargingStations.length
      });
      // ENKEL ALGORITME - GARANTERER MINST 2 BLÅMARKØRER 
      console.log('🔧 STARTER ENKEL 2-STASJON ALGORITME');
      console.log('📊 Input:', {
        batteryPercent: routeData.batteryPercentage,
        routeDistanceKm: route.distance / 1000,
        carRange: selectedCar.range,
        stationsCount: chargingStations.length
      });
      
      const routeKm = route.distance / 1000;
      const carRange = selectedCar.range;
      const startBattery = routeData.batteryPercentage;
      
      // Beregn første kritiske punkt (40% til 15% = 25% batteri brukt)
      const firstRange = (carRange * (startBattery - 15)) / 100;
      console.log('🔵 FØRSTE kritiske punkt ved:', firstRange.toFixed(1), 'km');
      
      // Beregn andre kritiske punkt (80% til 15% = 65% batteri brukt)  
      const secondRange = (carRange * 65) / 100;
      const secondCriticalPoint = firstRange + secondRange;
      console.log('🔵 ANDRE kritiske punkt ved:', secondCriticalPoint.toFixed(1), 'km');
      
      // Finn stasjoner nær disse punktene
      const optimized = [];
      
      // Finn første stasjon
      const firstStation = chargingStations
        .map(station => {
          let stationKm = 0;
          let minDist = Infinity;
          
          for (let i = 0; i < route.geometry.coordinates.length; i++) {
            const dist = getDistance(
              station.latitude, station.longitude,
              route.geometry.coordinates[i][1], route.geometry.coordinates[i][0]
            );
            if (dist < minDist) {
              minDist = dist;
              stationKm = (i / route.geometry.coordinates.length) * routeKm;
            }
          }
          
          return { ...station, distanceAlongRoute: stationKm, distanceFromRoute: minDist };
        })
        .filter(s => s.distanceFromRoute <= 20 && s.distanceAlongRoute >= firstRange - 50 && s.distanceAlongRoute <= firstRange + 50)
        .sort((a, b) => Math.abs(a.distanceAlongRoute - firstRange) - Math.abs(b.distanceAlongRoute - firstRange))[0];
      
      if (firstStation) {
        console.log('✅ FØRSTE stasjon funnet:', firstStation.name, 'ved', firstStation.distanceAlongRoute.toFixed(1), 'km');
        optimized.push(firstStation);
      }
      
      // Finn andre stasjon
      const secondStation = chargingStations
        .map(station => {
          let stationKm = 0;
          let minDist = Infinity;
          
          for (let i = 0; i < route.geometry.coordinates.length; i++) {
            const dist = getDistance(
              station.latitude, station.longitude,
              route.geometry.coordinates[i][1], route.geometry.coordinates[i][0]
            );
            if (dist < minDist) {
              minDist = dist;
              stationKm = (i / route.geometry.coordinates.length) * routeKm;
            }
          }
          
          return { ...station, distanceAlongRoute: stationKm, distanceFromRoute: minDist };
        })
        .filter(s => s.distanceFromRoute <= 20 && 
                     s.distanceAlongRoute >= secondCriticalPoint - 50 && 
                     s.distanceAlongRoute <= secondCriticalPoint + 50 &&
                     s.id !== firstStation?.id)
        .sort((a, b) => Math.abs(a.distanceAlongRoute - secondCriticalPoint) - Math.abs(b.distanceAlongRoute - secondCriticalPoint))[0];
      
      if (secondStation) {
        console.log('✅ ANDRE stasjon funnet:', secondStation.name, 'ved', secondStation.distanceAlongRoute.toFixed(1), 'km');
        optimized.push(secondStation);
      }
      
      console.log('🎯 RESULTAT: Fant', optimized.length, 'stasjoner for 2-punkt algoritme');

      console.log('✅ Optimalisering fullført. Funnet', optimized.length, 'ladestsjoner');
      setOptimizedStations(optimized);

      // Oppdater chargingStations med beregnet distanceAlongRoute FØRST
      console.log('🔧 Updating charging stations with distanceAlongRoute...');

      // FØRST: Legg til ALLE ladestasjoner med fargekoding basert på avstand til rute
      console.log('🟢🔴 LEGGER TIL ALLE LADESTASJONER MED AVSTANDSBASERT FARGEKODING...');
      console.log('📊 Totalt antall ladestasjoner:', chargingStations.length);
      
      const mapRouteCoords = route.geometry.coordinates;
      
      // Først beregn distanceAlongRoute for ALLE stasjoner
      const enhancedStations = chargingStations.map(station => {
        let minDistance = Infinity;
        let closestPointIndex = 0;
        let distanceAlongRoute = 0;
        
        // Finn nærmeste punkt på ruten
        for (let i = 0; i < mapRouteCoords.length; i++) {
          const distance = getDistance(
            station.latitude,
            station.longitude,
            mapRouteCoords[i][1],
            mapRouteCoords[i][0]
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = i;
          }
        }
        
        // Beregn faktisk distanse langs ruten til nærmeste punkt
        for (let i = 0; i < closestPointIndex; i++) {
          if (i < mapRouteCoords.length - 1) {
            distanceAlongRoute += getDistance(
              mapRouteCoords[i][1],
              mapRouteCoords[i][0],
              mapRouteCoords[i + 1][1],
              mapRouteCoords[i + 1][0]
            );
          }
        }
        
        return {
          ...station,
          distanceToRoute: minDistance,
          distanceAlongRoute: distanceAlongRoute
        };
      });
      
      // Oppdater chargingStations state med beregnet data
      setChargingStations(enhancedStations);
      console.log('✅ Updated', enhancedStations.length, 'stations with distanceAlongRoute');
      console.log('📊 First 3 enhanced stations:', enhancedStations.slice(0, 3).map(s => ({ 
        name: s.name, 
        distanceAlongRoute: s.distanceAlongRoute?.toFixed(1) + 'km' 
      })));
      
      // Nå legg til markører basert på enhanced data
      enhancedStations.forEach((station, index) => {
        const minDistance = station.distanceToRoute!;
        const distanceAlongRoute = station.distanceAlongRoute!;
        
        // Bestem farge basert på avstand: Rød hvis innenfor 5 km, grønn ellers
        const isNearRoute = minDistance <= 5.0; // 5 km
        
        const el = document.createElement('div');
        el.className = isNearRoute ? 'near-route-station-marker' : 'all-charging-station-marker';
        
        if (isNearRoute) {
          // Helrød markør med lyn for stasjoner nær ruten - litt større
          el.style.cssText = `
            background-color: #ef4444;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 1px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 5;
          `;
          el.innerHTML = '⚡';
        } else {
          // Grønne markører for stasjoner langt fra ruten
          el.style.cssText = `
            background-color: #00ff41;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 1px solid white;
            cursor: pointer;
            z-index: 1;
          `;
        }

        const popup = new mapboxgl.Popup({
          maxWidth: '320px',
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4;">
            <div style="background: linear-gradient(135deg, ${isNearRoute ? '#ef4444, #dc2626' : '#22c55e, #16a34a'}); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
              <h4 style="margin: 0; font-size: 16px; font-weight: 600;">${isNearRoute ? '🔴' : '🟢'} ${station.name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${station.location}</p>
              <div style="margin-top: 6px;">
                <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${isNearRoute ? '🎯 NÆR RUTE' : '🟢 TILGJENGELIG'}</span>
              </div>
            </div>
            
            <div style="background: ${isNearRoute ? '#fef2f2' : '#f0fdf4'}; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 13px; color: ${isNearRoute ? '#dc2626' : '#16a34a'}; font-weight: 600;">🛣️ ${minDistance.toFixed(1)} km fra rute ${isNearRoute ? '(nær ruten!)' : ''}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.power || 'N/A'}</div>
              </div>
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.cost || 'N/A'} kr/kWh</div>
              </div>
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
                <div style="color: ${(station.available || 0) > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${station.available || 0}/${station.total || 0}</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
              <button 
                onclick="window.showRouteToStation && window.showRouteToStation('${station.id}')"
                style="
                  background: ${isNearRoute ? '#ef4444' : '#22c55e'}; 
                  color: white; 
                  border: none; 
                  padding: 10px 12px; 
                  border-radius: 6px; 
                  font-size: 13px; 
                  font-weight: 600; 
                  cursor: pointer; 
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='${isNearRoute ? '#dc2626' : '#16a34a'}'"
                onmouseout="this.style.background='${isNearRoute ? '#ef4444' : '#22c55e'}'"
              >
                🗺️ Vis rute til stasjon
              </button>
            </div>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        
        if (index < 10) {
          console.log(`${isNearRoute ? '🔴' : '🟢'} MARKØR ${index + 1}: ${station.name} (${minDistance.toFixed(1)}km, along route: ${distanceAlongRoute.toFixed(1)}km)`);
        }
      });
      
      console.log('🔵 STARTER BLÅ MARKØR ANALYSE...');
      
      // Finn de mest effektive stasjonene (blå markører) - bruk enhancedStations
      const nearRouteStations = enhancedStations.filter(station => 
        station.distanceToRoute! <= 5.0
      );
      
      console.log('🔵 ANALYSERER EFFEKTIVITET FOR', nearRouteStations.length, 'STASJONER NÆR RUTEN...');
      console.log('  - Startbatteri:', routeData.batteryPercentage + '%');
      console.log('  - Bil rekkevidde:', selectedCar.range + 'km');
      console.log('  - Rutelengde:', routeDistance.toFixed(1) + 'km');
      
      // Beregn hvor langt bilen kan kjøre med startbatteri
      const maxRangeWithStartBattery = (selectedCar.range * routeData.batteryPercentage) / 100;
      const remainingDistanceAfterStart = routeDistance - maxRangeWithStartBattery;
      
      // Beregn hvor langt bilen kan kjøre før batteriet når 10-15% (inkluderer hengervekt)
      const trailerFactor = routeData.trailerWeight > 0 ? 1 + (routeData.trailerWeight * 0.0015) : 1; // 0.15% økt forbruk per 100kg
      const adjustedRange = selectedCar.range / trailerFactor;
      
      const distanceAt15Percent = (adjustedRange * (routeData.batteryPercentage - 15)) / 100;
      const distanceAt10Percent = (adjustedRange * (routeData.batteryPercentage - 10)) / 100;
      
      console.log('  - Hengervekt:', routeData.trailerWeight + 'kg (faktor: ' + trailerFactor.toFixed(2) + ')');
      console.log('  - Justert rekkevidde:', adjustedRange.toFixed(1) + 'km');
      console.log('  - Distanse ved 15% batteri:', Math.max(0, distanceAt15Percent).toFixed(1) + 'km');
      console.log('  - Distanse ved 10% batteri:', Math.max(0, distanceAt10Percent).toFixed(1) + 'km');
      
      // Sjekk om vi trenger lading på ruten
      if (distanceAt15Percent >= routeDistance) {
        console.log('✅ BATTERIET HOLDER HELE VEIEN! Ingen blå markører nødvendig');
      } else {
        console.log('🔋 TRENGER LADING! Finner stasjoner ved kritisk batterinivå');
        
        // Finn stasjoner som er plassert der batteriet når 10-15%
        const criticalStations = nearRouteStations.filter(station => {
          // Anslå stasjonens posisjon langs ruten basert på koordinater
          // Forenklet: bruk avstand fra start som approksimering
          const stationDistance = getDistance(
            route.geometry.coordinates[0][1], // start lat
            route.geometry.coordinates[0][0], // start lng
            station.latitude,
            station.longitude
          );
          
          // Sjekk om stasjonen er i det kritiske området (mellom 10% og 15% batteri)
          return stationDistance >= Math.max(0, distanceAt15Percent - 20) && 
                 stationDistance <= Math.max(0, distanceAt10Percent + 50);
        });
        
        console.log('🎯 FANT', criticalStations.length, 'KRITISKE STASJONER VED 10-15% BATTERI');
        
        if (criticalStations.length === 0) {
          console.log('⚠️ INGEN KRITISKE STASJONER FUNNET VED 10-15% BATTERI');
        } else {
          // Beregn effektivitetsscore for kritiske stasjoner (inkluderer vær, vind og hengervekt)
          const stationsWithScore = criticalStations.map(station => {
            const distance = (station as any).distanceToRoute;
            const cost = station.cost;
            const availability = station.available / station.total;
            const powerValue = station.fastCharger ? 2 : 1;
            
            // Hent værdata og beregn påvirkning på effektivitet
            const weatherFactor = routeAnalysis?.weather?.rangeFactor || 1;
            const trailerImpact = routeData.trailerWeight > 0 ? (routeData.trailerWeight * 0.001) : 0; // 0.1% per 100kg
            const totalEfficiencyImpact = weatherFactor + trailerImpact;
            
            // Effektivitetsscore (lavere er bedre) - inkluderer vær, vind og hengervekt
            const efficiencyScore = (distance * 0.3) + (cost * 2 * 0.4) + ((1 - availability) * 3 * 0.2) + ((2 - powerValue) * 0.1) + (totalEfficiencyImpact * 0.5);
          
          return {
            ...station,
            efficiencyScore
          };
        });
        
        // Sorter etter beste score og ta de 3 beste
        const bestStations = stationsWithScore
          .sort((a, b) => a.efficiencyScore - b.efficiencyScore)
          .slice(0, 3);
        
        console.log('🎯 FANT DE 3 MEST EFFEKTIVE STASJONENE (med vær, vind og hengervekt):');
        bestStations.forEach((station, index) => {
          console.log(`  ${index + 1}. ${station.name} (Score: ${station.efficiencyScore.toFixed(2)})`);
        });
        
        console.log('🔵 LEGGER TIL BLÅ MARKØRER FOR MEST EFFEKTIVE STASJONER...');
        console.log('🔵 Antall blå markører som skal legges til:', bestStations.length);
        
        // Legg til blå markører for de mest effektive stasjonene
        bestStations.forEach((station, index) => {
          const el = document.createElement('div');
          el.className = 'best-efficiency-station-marker';
          el.style.cssText = `
            background-color: #0066ff;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
            z-index: 100;
            box-shadow: 0 0 15px rgba(0, 102, 255, 0.8);
          `;
          el.innerHTML = '⚡';

          // Hent live data for stasjonen, fallback til original data
          const liveData = liveStationData[station.id] || station;
          console.log('🔄 Creating popup for', station.name, '- Live data:', liveData);
          
          const popup = new mapboxgl.Popup({
            maxWidth: '300px',
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4; min-width: 250px;">
              <div style="background: linear-gradient(135deg, #0066ff, #00aaff); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 600;">⚡ ${liveData.name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${liveData.location}</p>
                <div style="margin-top: 6px;">
                  <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔴 LIVE DATA</span>
                </div>
              </div>
              
              <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                <p style="margin: 0; font-size: 13px; color: #0066ff; font-weight: 600;">⚡ Kritisk ladestasjon - batteriet når lavt nivå her</p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${liveData.power || 'N/A'}</div>
                </div>
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${liveData.cost || 'N/A'} kr/kWh</div>
                </div>
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
                  <div style="color: ${(liveData.available || 0) > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${liveData.available || 0}/${liveData.total || 0}</div>
                </div>
              </div>
              
              <button 
                onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', ${station.distanceAlongRoute || 0}, 10)"
                style="
                  width: 100%; 
                  background: #0066ff; 
                  color: white; 
                  border: none; 
                  padding: 12px 16px; 
                  border-radius: 6px; 
                  font-size: 14px; 
                  font-weight: 600; 
                  cursor: pointer; 
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='#0052cc'"
                onmouseout="this.style.background='#0066ff'"
              >
                ⚡ Velg ladeprosent
              </button>
            </div>
          `);
          
          console.log('✅ Popup created for', station.name, 'with live data:', {
            power: liveData.power,
            cost: liveData.cost,
            available: liveData.available,
            total: liveData.total
          });

          new mapboxgl.Marker(el)
            .setLngLat([station.longitude, station.latitude])
            .setPopup(popup)
            .addTo(map.current!);
          
          console.log(`🔵 BLÅ MARKØR ${index + 1}: ${station.name} - MEST EFFEKTIV! LAGT TIL!`);
          
          // Send alle blå stasjoner til ladestasjonkartet ved første markør
          if (index === 0) {
            sendStationsToChargingMap(bestStations, station);
          }
        });
        
        const nearRouteCount = nearRouteStations.length;
        console.log(`✅ ALLE ${chargingStations.length} MARKØRER LAGT TIL! (${nearRouteCount} røde innenfor 5km, ${chargingStations.length - nearRouteCount} grønne, ${bestStations.length} blå mest effektive)`);
        
        // Finn kritisk batteripunkt og gjør en rød markør blå
        console.log('🔴➡️🔵 STARTER KRITISK MARKØR LOGIKK 🔴➡️🔵');
        const routeKm = route.distance / 1000;
        const carRange = selectedCar?.range || 441;
        const startBattery = routeData.batteryPercentage;
        
        // Beregn hvor langt man kan kjøre til 10-15% batteri igjen
        const usableRange = (carRange * (startBattery - 12)) / 100; // 12% som kritisk punkt
        const criticalPointKm = usableRange;
        
        console.log(`🔴➡️🔵 KRITISK BATTERIPUNKT ved ${criticalPointKm.toFixed(1)}km (12% batteri igjen)`);
        console.log(`🔴➡️🔵 HAR ${nearRouteStations.length} RØDE STASJONER Å VELGE FRA:`, nearRouteStations.map(s => `${s.name} ved ${s.distanceAlongRoute?.toFixed(1)}km`));
        
        // Finn nærmeste røde stasjon til kritisk punkt
        const criticalStation = nearRouteStations
          .filter(s => s.distanceAlongRoute && s.distanceAlongRoute >= criticalPointKm * 0.9) // Litt før kritisk punkt
          .sort((a, b) => Math.abs(a.distanceAlongRoute - criticalPointKm) - Math.abs(b.distanceAlongRoute - criticalPointKm))[0];
        
        console.log(`🔴➡️🔵 FUNNET KRITISK STASJON:`, criticalStation ? criticalStation.name : 'INGEN');
        
        if (criticalStation) {
          console.log(`🔵 GJØR RØD STASJON BLÅ:`, criticalStation.name, `ved ${criticalStation.distanceAlongRoute?.toFixed(1)}km`);
          
          // Fjern den røde markøren først
          const existingMarker = document.querySelector(`[data-station-id="${criticalStation.id}"]`);
          if (existingMarker) {
            existingMarker.remove();
          }
          
          // Lag blå markør
          const blueEl = document.createElement('div');
          blueEl.setAttribute('data-station-id', criticalStation.id);
          blueEl.style.cssText = `
            background: linear-gradient(135deg, #0066ff, #00aaff);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            z-index: 100;
            box-shadow: 0 0 30px rgba(0, 102, 255, 0.8);
            animation: pulse 2s infinite;
          `;
          blueEl.innerHTML = '⚡';
          
          new mapboxgl.Marker(blueEl)
            .setLngLat([criticalStation.longitude, criticalStation.latitude])
            .addTo(map.current!);
            
          console.log(`✅ BLÅ KRITISK MARKØR LAGT TIL for ${criticalStation.name}!`);
          
          // Send til parent
          onChargingStationUpdate?.(criticalStation, true);
          setOptimizedStations([criticalStation]);
        }
        }
        
        // Beregn progressive ladestasjoner for fremtidige sykluser
        console.log('🔄 BEREGNER ALLE PROGRESSIVE LADESTASJONER...');
        const allProgressiveStations = [];
        
        // Beregn hvor mange ladesykluser vi trenger for hele ruten
        const maxCycles = Math.ceil(routeDistance / (adjustedRange * 0.7));
        console.log('📊 Beregnet', maxCycles, 'maksimale ladesykluser for', routeDistance.toFixed(1), 'km rute');
        
        // Beregn realistiske ladestasjoner for alle sykluser
        console.log('🔋 BEREGNER REALISTISKE LADESTASJONER FOR ALLE SYKLUSER...');
        const realisticStations = calculateRealisticChargingStations(
          route.geometry.coordinates,
          routeDistance,
          selectedCar,
          routeData.batteryPercentage,
          nearRouteStations,
          routeData.trailerWeight
        );
        
        // Sett opp alle sykluser
        setNextChargingStations(realisticStations.allCycles.flat().map((station, index) => ({
          ...station,
          chargingCycle: Math.floor(index / 2), // 2 stasjoner per syklus
          isVisible: Math.floor(index / 2) === chargingProgress
        })));
        
        console.log('🔋 Satt opp realistiske ladestasjoner:');
        console.log('  - Første syklus:', realisticStations.firstCycleStations.length, 'stasjoner');
        console.log('  - Andre syklus:', realisticStations.secondCycleStations.length, 'stasjoner');
        console.log('  - Totalt sykluser:', realisticStations.allCycles.length);
        
        // DEBUG: Vis ladeknapp hvis det finnes stasjoner for første syklus
        console.log('🔵 DEBUG: Sjekker om ladeknapp skal vises...');
        console.log('🔵 DEBUG: realisticStations.firstCycleStations.length =', realisticStations.firstCycleStations.length);
        console.log('🔵 DEBUG: chargingProgress =', chargingProgress);
        console.log('🔵 DEBUG: showChargingButton før =', showChargingButton);
        
        if (realisticStations.firstCycleStations.length > 0) {
          console.log('🔵 DEBUG: Setter currentChargingStation til:', realisticStations.firstCycleStations[0].name);
          setCurrentChargingStation(realisticStations.firstCycleStations[0]);
          setShowChargingButton(true);
          console.log('🔵 DEBUG: Satte showChargingButton til true');
          
          // AUTOMATISK: Sjekk batteriprosent og lag blå markør for kritisk stasjon
          const currentBatteryPercent = routeData.batteryPercentage;
          console.log('🔋 Nåværende batteriprosent:', currentBatteryPercent + '%');
          
          if (currentBatteryPercent <= 10) {
            console.log('⚠️ KRITISK BATTERINIVÅ DETEKTERT! Lager blå markør...');
            
            // Finn nærmeste stasjon til kritisk punkt
            const carRange = selectedCar?.range || 441;
            const usableRange = (carRange * currentBatteryPercent) / 100;
            const criticalDistance = usableRange * 0.85; // 85% av tilgjengelig rekkevidde
            
            console.log('🎯 Kritisk avstand beregnet:', criticalDistance.toFixed(1), 'km');
            
            // Finn nærmeste stasjon langs ruten til dette punktet
            let nearestStation = null;
            let smallestDistance = Infinity;
            
            optimized.forEach(station => {
              if (station.distanceAlongRoute && Math.abs(station.distanceAlongRoute - criticalDistance) < smallestDistance) {
                smallestDistance = Math.abs(station.distanceAlongRoute - criticalDistance);
                nearestStation = station;
              }
            });
            
            if (nearestStation) {
              console.log('🔵 AUTOMATISK: Lager blå markør for kritisk stasjon:', nearestStation.name);
              
              // Fjern eksisterende rød markør på samme posisjon
              const existingMarkers = document.querySelectorAll('.charging-station-marker');
              existingMarkers.forEach(marker => {
                const markerElement = marker as HTMLElement;
                const stationId = markerElement.getAttribute('data-station-id');
                if (stationId === nearestStation!.id) {
                  console.log('🔴➡️🔵 FJERNER RØD MARKØR for å erstatte med blå:', nearestStation!.name);
                  markerElement.remove();
                }
              });
              
              // Lag ny blå markør
              const blueEl = document.createElement('div');
              blueEl.className = 'blue-critical-marker';
              blueEl.setAttribute('data-station-id', nearestStation.id);
              blueEl.style.cssText = `
                background: linear-gradient(135deg, #0066ff, #00aaff);
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 10px;
                z-index: 999999 !important;
                position: relative;
                box-shadow: 0 0 15px rgba(0, 102, 255, 0.8);
                animation: pulse 2s infinite;
              `;
              blueEl.innerHTML = '⚡';
              
              const blueMarker = new mapboxgl.Marker(blueEl)
                .setLngLat([nearestStation.longitude, nearestStation.latitude])
                .addTo(map.current!);
              
              console.log('🔵 BLÅ MARKØR AUTOMATISK LAGT TIL for:', nearestStation.name);
              sendStationToChargingMap(nearestStation);
            }
          }
          
          // FJERNET: Sender ikke automatisk til parent - kun når blå markør klikkes
          console.log('🔵 DEBUG: Venter på blå markør klikk for å sende til parent');
        } else {
          console.log('🔵 DEBUG: Ingen stasjoner funnet, skjuler ladeknapp');
          setShowChargingButton(false);
        }
      }

      // DERETTER: Legg til markører for optimerte ladestasjoner (større og mer synlige)
      console.log('⚡ LEGGER TIL ANBEFALTE STASJONER...');
      console.log('📊 Antall anbefalte stasjoner:', optimized.length);
      
      if (optimized.length === 0) {
        console.log('🚫 INGEN ANBEFALTE STASJONER Å VISE');
      }
      
      // ENKEL LOGIKK: Første stasjon blir BLÅ hvis batteriet er lavt
      const currentBatteryPercent = routeData.batteryPercentage;
      console.log('🔋 SJEKKER BATTERI VED MARKØR-OPPRETTING:', currentBatteryPercent + '%');
      
      optimized.forEach((station, index) => {
        // FØRSTE stasjon blir BLÅ hvis batteriet er 20% eller lavere
        const shouldBeBlue = index === 0 && currentBatteryPercent <= 20;
        
        if (shouldBeBlue) {
          console.log('🔵🔵🔵 LAGER BLÅ MARKØR (KRITISK BATTERI) for:', station.name);
          
          // BLÅ MARKØR - Større og mer synlig
          const el = document.createElement('div');
          el.className = 'critical-blue-marker';
          el.setAttribute('data-station-id', station.id);
          el.style.cssText = `
            background: linear-gradient(135deg, #0066ff, #00aaff);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 4px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            z-index: 999999 !important;
            position: relative;
            box-shadow: 0 0 30px rgba(0, 102, 255, 1);
            animation: pulse 1.5s infinite;
          `;
          el.innerHTML = '⚡';

          const popup = new mapboxgl.Popup({
            maxWidth: '320px',
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4;">
              <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🔴 ${station.name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${station.location}</p>
                <div style="margin-top: 6px;">
                  <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">⚠️ KRITISK BATTERI</span>
                </div>
              </div>
              
              <div style="background: #fef2f2; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                <p style="margin: 0; font-size: 13px; color: #dc2626; font-weight: 600;">⚠️ Batteriet er kritisk lavt (${currentBatteryPercent}%) - Nødvendig ladestasjon!</p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.power || 'N/A'}</div>
                </div>
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.cost || 'N/A'} kr/kWh</div>
                </div>
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
                  <div style="color: ${(station.available || 0) > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${station.available || 0}/${station.total || 0}</div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button 
                  onclick="window.showRouteToStation && window.showRouteToStation('${station.id}')"
                  style="
                    background: #22c55e; 
                    color: white; 
                    border: none; 
                    padding: 10px 12px; 
                    border-radius: 6px; 
                    font-size: 13px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='#16a34a'"
                  onmouseout="this.style.background='#22c55e'"
                >
                  🗺️ Vis rute
                </button>
                <button 
                  onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', 0, ${currentBatteryPercent})"
                  style="
                    background: #ef4444; 
                    color: white; 
                    border: none; 
                    padding: 10px 12px; 
                    border-radius: 6px; 
                    font-size: 13px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='#dc2626'"
                  onmouseout="this.style.background='#ef4444'"
                >
                  ⚡ Lading
                </button>
              </div>
            </div>
          `);

          new mapboxgl.Marker(el)
            .setLngLat([station.longitude, station.latitude])
            .setPopup(popup)
            .addTo(map.current!);
            
          console.log('✅ BLÅ KRITISK MARKØR LAGT TIL for:', station.name);
          sendStationToChargingMap(station);
          
        } else {
          console.log('🔴 Vanlig rød markør for:', station.name);
          
          // VANLIG RØD MARKØR
          const el = document.createElement('div');
          el.className = 'charging-station-marker';
          el.setAttribute('data-station-id', station.id);
          el.style.cssText = `
            background-color: #ef4444;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 1px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 10;
          `;
          el.innerHTML = '⚡';

          const popup = new mapboxgl.Popup({
            maxWidth: '320px',
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4;">
              <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🔴 ${station.name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${station.location}</p>
                <div style="margin-top: 6px;">
                  <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🎯 RUTE-OPTIMERT</span>
                </div>
              </div>
              
              <div style="background: #fef2f2; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                <p style="margin: 0; font-size: 13px; color: #dc2626; font-weight: 600;">🎯 Optimert for din rute</p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.power || 'N/A'}</div>
                </div>
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${station.cost || 'N/A'} kr/kWh</div>
                </div>
                <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
                  <div style="color: ${(station.available || 0) > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${station.available || 0}/${station.total || 0}</div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button 
                  onclick="window.showRouteToStation && window.showRouteToStation('${station.id}')"
                  style="
                    background: #22c55e; 
                    color: white; 
                    border: none; 
                    padding: 10px 12px; 
                    border-radius: 6px; 
                    font-size: 13px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='#16a34a'"
                  onmouseout="this.style.background='#22c55e'"
                >
                  🗺️ Vis rute
                </button>
                <button 
                  onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', ${(station as any).distanceAlongRoute || 0}, 50)"
                  style="
                    background: #ef4444; 
                    color: white; 
                    border: none; 
                    padding: 10px 12px; 
                    border-radius: 6px; 
                    font-size: 13px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='#dc2626'"
                  onmouseout="this.style.background='#ef4444'"
                >
                  ⚡ Lading
                </button>
              </div>
            </div>
          `);

          new mapboxgl.Marker(el)
            .setLngLat([station.longitude, station.latitude])
            .setPopup(popup)
            .addTo(map.current!);
        }
      });
      
      // Legg til progressive blå markører for neste ladesyklus
      console.log('🔄 LEGGER TIL PROGRESSIVE BLÅ MARKØRER...');
      const visibleProgressiveStations = nextChargingStations.filter(station => 
        (station as any).chargingCycle === chargingProgress
      );
      
      console.log('🔵 Viser', visibleProgressiveStations.length, 'blå markører for syklus', chargingProgress);
      
      visibleProgressiveStations.forEach((station, index) => {
        const el = document.createElement('div');
        el.className = 'progressive-charging-marker';
        el.style.cssText = `
          background: linear-gradient(45deg, #0066ff, #00aaff);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
          font-weight: bold;
          z-index: 100;
          box-shadow: 0 0 20px rgba(0, 102, 255, 0.8), 0 0 40px rgba(0, 170, 255, 0.4);
          animation: pulse 2s infinite;
        `;
              el.innerHTML = `${index + 1}`; // Nummerer markørene i rekkefølge

        // Legg til click handler for interaktiv lading
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('🔋 KLIKKET PÅ BLÅMARKØR:', station.name);
          setSelectedChargingStation(station);
          setShowChargingDialog(true);
        });

        // Hent live data for stasjonen, fallback til original data  
        const liveData = liveStationData[station.id] || station;
        console.log('🔄 Creating progressive popup for', station.name, '- Live data:', liveData);
        
        const popup = new mapboxgl.Popup({
          maxWidth: '300px',
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="font-family: Inter, sans-serif; padding: 12px; line-height: 1.4; min-width: 250px;">
            <div style="background: linear-gradient(135deg, #0066ff, #00aaff); color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px;">
              <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🔋 ${liveData.name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">📍 ${liveData.location}</p>
              <div style="margin-top: 6px;">
                <span style="background: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔴 LIVE DATA</span>
              </div>
            </div>
            
            <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 13px; color: #0066ff; font-weight: 600;">🔋 Batteri ved ankomst: ~10-15%</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">⚡ EFFEKT</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${liveData.power || 'N/A'}</div>
              </div>
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">💰 PRIS</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 700;">${liveData.cost || 'N/A'} kr/kWh</div>
              </div>
              <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">📊 LEDIG</div>
                <div style="color: ${(liveData.available || 0) > 0 ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: 700;">${liveData.available || 0}/${liveData.total || 0}</div>
              </div>
            </div>
            
            <button 
              onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', ${station.distanceAlongRoute || 0}, 10)"
              style="
                width: 100%; 
                background: #0066ff; 
                color: white; 
                border: none; 
                padding: 12px 16px; 
                border-radius: 6px; 
                font-size: 14px; 
                font-weight: 600; 
                cursor: pointer; 
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#0052cc'"
              onmouseout="this.style.background='#0066ff'"
            >
              ⚡ Velg ladeprosent
            </button>
          </div>
        `);
        
        console.log('✅ Progressive popup created for', station.name, 'with live data:', {
          power: liveData.power,
          cost: liveData.cost,
          available: liveData.available,
          total: liveData.total
        });

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        
        console.log('🔵 La til progressiv blå markør:', station.name, 'for syklus', (station as any).chargingCycle);
      });
      
      console.log('ℹ️ Ladestasjoner er nå fargekodet: 🟢 Alle stasjoner, 🔴 Nær ruten (<5km), 🔵 Mest effektive (3 stk)');

      // Tilpass kart til å vise hele ruten
      console.log('🗺️ Setter kartbounds...');
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(startCoords);
      bounds.extend(endCoords);
      console.log('📍 Bounds satt for start og slutt. Optimerte stasjoner:', optimized.length);
      
      optimized.forEach(station => {
        bounds.extend([station.longitude, station.latitude]);
        console.log('📍 La til stasjon i bounds:', station.name);
      });

      map.current!.fitBounds(bounds, { padding: 50 });
      console.log('✅ FitBounds fullført');

      // FJERNET: Overskrev den realistiske analysen som allerede er satt
      console.log('ℹ️ Analyse allerede satt tidligere i koden');

      // FIT BOUNDS til slutt for å vise hele ruten
      const routeCoords = route.geometry.coordinates;
      const routeBounds = routeCoords.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]));

      setTimeout(() => {
        map.current!.fitBounds(routeBounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1500
        });
        console.log('🗺️ Kartet tilpasset til ny rute:', routeType);
        
        // VIKTIG: Sett loading til false når alt er ferdig
        setLoading(false);
        console.log('✅ Ruteplanlegging fullført!');
      }, 500);

    } catch (error) {
      console.error('Feil ved oppdatering av rute:', error);
      setError(`Kunne ikke oppdatere ruten: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
      setLoading(false); // Sett loading til false også ved feil
      // IKKE reset andre state-verdier ved feil - la brukeren fortsette
    }
    }, 100); // Redusert til 100ms for raskere respons
  };

  // FJERNET - Bruker nå calculateAllCriticalPoints istedet

  // Beregn ladetid
  const calculateChargingTime = (fromBattery: number, toBattery: number, fastCharger: boolean): number => {
    const batteryDifference = toBattery - fromBattery;
    const chargingSpeed = fastCharger ? 5 : 2; // %/min (ca)
    return Math.ceil(batteryDifference / chargingSpeed);
  };

  // Beregn reiseanalyse
  const calculateTripAnalysis = (
    distance: number,
    timeHours: number,
    stations: ChargingStation[],
    weatherData?: WeatherData
  ): TripAnalysis => {
    console.log('🧮 BEREGNING START:', { distance, timeHours, stationsCount: stations.length });
    
    // Realistisk ladetid beregning (15-30 min per stopp)
    const averageChargingTimePerStop = 25; // minutter
    const totalChargingTime = stations.length * averageChargingTimePerStop;
    console.log('⏱️ Ladetid beregning:', { stationsCount: stations.length, averageTime: averageChargingTimePerStop, totalTime: totalChargingTime });
    
    // Realistisk kostnad basert på distanse og strømforbruk
    // Typisk elbil: 20 kWh/100km, strømpris: 4-6 kr/kWh ved hurtiglading
    const consumptionPer100km = 20; // kWh
    const averageChargingCostPerKwh = 5.0; // kr/kWh
    const distanceKm = distance / 1000; // Konverter meter til km
    const totalEnergyNeeded = distanceKm * (consumptionPer100km / 100); // kWh for hele turen
    const totalCost = totalEnergyNeeded * averageChargingCostPerKwh;
    console.log('💰 Kostnad beregning:', { distanceKm, totalEnergyNeeded, costPerKwh: averageChargingCostPerKwh, totalCost });

    // CO2-besparelse sammenlignet med bensinbil (ca 120g CO2/km)
    const co2Saved = distanceKm * 0.12; // kg CO2
    console.log('🌱 CO2 beregning:', { distanceKm, co2PerKm: 0.12, totalCo2Saved: co2Saved });

    // Effektivitet basert på værforhold, vind og hengervekt
    const weatherFactor = weatherData?.rangeFactor || 1;
    const trailerImpact = routeData.trailerWeight > 0 ? (1 - (routeData.trailerWeight * 0.0015)) : 1; // Redusert effektivitet med henger
    const efficiency = weatherFactor * trailerImpact * 0.85; // Base effektivitet 85%

    const result = {
      totalDistance: distanceKm, // Vis i km
      totalTime: timeHours + (totalChargingTime / 60), // Legg til ladetid
      totalCost: Math.round(totalCost),
      chargingTime: totalChargingTime,
      co2Saved: Math.round(co2Saved),
      efficiency: Math.round(efficiency * 100) / 100, // Avrund til 2 desimaler
      weather: weatherData
    };
    
    console.log('✅ BEREGNING RESULTAT:', result);
    return result;
  };

  // Fjernet duplikat weatherData funksjon - bruker den optimaliserte versjonen med cache

  // Effekt for initialisering av kart
  useEffect(() => {
    if (isVisible && accessToken) {
      console.log('🌟 Komponenten er synlig OG token er tilgjengelig, initialiserer kart...');
      const timer = setTimeout(() => {
        initializeMap();
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      cleanupMap();
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current);
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isVisible, accessToken]); // Legg til accessToken som dependency

  // Effekt for lasting av ladestasjoner
  useEffect(() => {
    console.log('🔌 useEffect for ladestasjoner starter...');
    const loadChargingStations = async () => {
      try {
        console.log('🚀 Starter lasting av ladestasjoner...');
        const stations = await fetchNorwegianChargingStations();
        console.log('📋 Leste', stations.length, 'stasjoner fra database');
        setChargingStations(stations);
        console.log('✅ Ladestasjoner satt i state:', stations.length);
      } catch (error) {
        console.error('❌ Feil ved lasting av ladestasjoner:', error);
      }
    };

    loadChargingStations();
  }, []);

  // Effekt for logge endringer (ikke oppdater automatisk)
  useEffect(() => {
    if (routeData.from && routeData.to && selectedCar) {
      console.log('🔄 Route data endret (venter på manuell oppdatering):');
      console.log('  - Fra:', routeData.from);
      console.log('  - Til:', routeData.to); 
      console.log('  - Via:', routeData.via);
      console.log('  - Batteri:', routeData.batteryPercentage, '%');
      console.log('  - Trailer:', routeData.trailerWeight);
      console.log('💡 Trykk "Planlegg rute" for å oppdatere kartet med nye innstillinger');
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, routeData.trailerWeight, selectedCar]);

  // KONSOLIDERT useEffect for ruteplanlegging - eliminerer re-rendering loops
  useEffect(() => {
    console.log('🎯 Route handling useEffect triggered:', {
      routeTrigger,
      selectedRouteId,
      hasMap: !!map.current,
      hasFrom: !!routeData.from,
      hasTo: !!routeData.to,
      hasCar: !!selectedCar,
      hasToken: !!accessToken,
      isLoading: loading
    });

    // Kun oppdater når:
    // 1. Manual trigger fra "Planlegg rute" knappen, ELLER
    // 2. Rutevalg endres (men kun hvis rute allerede er planlagt)
    const shouldUpdateRoute = routeTrigger > 0 || 
                             (selectedRouteId && map.current && routeData.from && routeData.to);

    if (shouldUpdateRoute && map.current && routeData.from && routeData.to && selectedCar && accessToken && !loading) {
      console.log('🚀 STARTER RUTEPLANLEGGING:', selectedRouteId || 'fastest');
      const routeType = selectedRouteId || 'fastest';
      
      // Sjekk om ruten faktisk vises på kartet - hvis ikke, kjør beregning på nytt
      const currentRouteKey = `${routeData.from}-${routeData.to}-${routeType}-${routeData.batteryPercentage}`;
      const lastRouteKey = sessionStorage.getItem('lastRouteKey');
      const hasVisibleRoute = currentRoute && currentRoute.distance > 0;
      
      if (currentRouteKey !== lastRouteKey || !hasVisibleRoute) {
        console.log('🆕 Ny rute eller ingen synlig rute, starter beregning...');
        sessionStorage.setItem('lastRouteKey', currentRouteKey);
        updateMapRoute(routeType);
      } else {
        console.log('♻️ Samme rute allerede beregnet og synlig, hopper over');
      }
    } else {
      console.log('⏸️ Venter på requirements eller allerede laster...');
    }
  }, [routeTrigger, selectedRouteId]); // BARE disse dependencies for å unngå loops

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
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Planlegger rute...</span>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden bg-card/95 backdrop-blur-sm border-border">
          <div 
            ref={mapContainer}
            className="w-full h-96 bg-muted"
            style={{ minHeight: '400px' }}
          />
        </Card>

      </div>

      {/* Analyse og ladestasjoner */}
      <div className="w-full mt-6 bg-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary animate-glow-pulse" />
            <h4 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Ruteanalyse</h4>
          </div>
          
          {/* Live oppdatering knapp */}
          <Button
            onClick={async () => {
              try {
                console.log('🔄 Triggering live station updates...');
                console.log('🔄 Current liveStationData before update:', liveStationData);
                
                const { data, error } = await supabase.functions.invoke('update-charging-stations');
                
                if (error) {
                  console.error('❌ Edge function error:', error);
                  throw error;
                }
                
                console.log('✅ Live updates triggered successfully:', data);
                
                toast({
                  title: "🔄 Live oppdateringer startet",
                  description: "Ladestasjondata oppdateres nå. Se popup-ene for endringer!",
                });
              } catch (error) {
                console.error('❌ Error triggering updates:', error);
                toast({
                  title: "❌ Feil",
                  description: `Kunne ikke starte live oppdateringer: ${error.message}`,
                  variant: "destructive"
                });
              }
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            🔴 Simuler live data
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full bg-transparent" style={{backgroundColor: 'transparent'}}>
          <TabsList className="grid w-full grid-cols-2 mb-4 glass-card neon-glow border border-border">
            <TabsTrigger 
              value="analysis" 
              className="flex items-center gap-2 font-orbitron font-semibold data-[state=active]:bg-gradient-electric data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon !bg-transparent hover:bg-primary/20 transition-all duration-300"
            >
              <TrendingUp className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger 
              value="stations" 
              className="flex items-center gap-2 font-orbitron font-semibold data-[state=active]:bg-gradient-electric data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon !bg-transparent hover:bg-primary/20 transition-all duration-300"
            >
              <Zap className="h-4 w-4" />
              Ladestasjoner
            </TabsTrigger>
          </TabsList>

        <TabsContent value="analysis" className="space-y-4 bg-transparent">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Route className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Total distanse</p>
                     <p className="text-3xl font-orbitron font-bold text-gradient">
                       {routeAnalysis ? Math.round(routeAnalysis.totalDistance) : '---'} km
                     </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Total tid</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">
                      {routeAnalysis ? `${Math.floor(routeAnalysis.totalTime)}t ${Math.round((routeAnalysis.totalTime % 1) * 60)}m` : '---'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Ladekostnad</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{routeAnalysis?.totalCost || 0} kr</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Ladetid</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{routeAnalysis?.chargingTime || 0} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-green-500 animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">CO₂ spart</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{routeAnalysis ? Math.round(routeAnalysis.co2Saved) : 0} kg</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Effektivitet</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">
                      {routeAnalysis ? Math.round(routeAnalysis.efficiency * 100) : 100}%
                    </p>
                  </div>
                </div>
              </Card>

              {routeAnalysis?.weather && (
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border md:col-span-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Værforhold</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Start: {routeData.from}</p>
                      <ul className="text-sm mt-1 space-y-1">
                        <li>• Temperatur: {routeAnalysis.weather.startWeather.temperature}°C</li>
                        <li>• Vindhastigher: {routeAnalysis.weather.startWeather.windSpeed} km/t</li>
                        <li>• Luftfuktighet: {routeAnalysis.weather.startWeather.humidity}%</li>
                        <li>• Værforhold: {routeAnalysis.weather.startWeather.weatherCondition}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Slutt: {routeData.to}</p>
                      <ul className="text-sm mt-1 space-y-1">
                        <li>• Temperatur: {routeAnalysis.weather.endWeather.temperature}°C</li>
                        <li>• Vindhastigher: {routeAnalysis.weather.endWeather.windSpeed} km/t</li>
                        <li>• Luftfuktighet: {routeAnalysis.weather.endWeather.humidity}%</li>
                        <li>• Værforhold: {routeAnalysis.weather.endWeather.weatherCondition}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Gjennomsnittlige forhold</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Temperatur: {routeAnalysis.weather.averageConditions.temperature}°C</li>
                      <li>• Luftfuktighet: {routeAnalysis.weather.averageConditions.humidity}%</li>
                      <li>• Vindforhold: {routeAnalysis.weather.averageConditions.windSpeed} km/t</li>
                      <li>• Værforhold: {routeAnalysis.weather.startWeather.weatherCondition}</li>
                    </ul>
                  </div>
                 </Card>
              )}
           </div>
        </TabsContent>

        <TabsContent value="stations" className="space-y-4 bg-transparent">
          <div className="grid gap-4">
            {optimizedStations.length > 0 ? (
              <>
                {/* Vis obligatoriske stasjoner først */}
                {optimizedStations.filter((station: any) => station.isRequired).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xl font-orbitron font-bold text-red-600 flex items-center gap-2 animate-glow-pulse">
                      ⚠️ Obligatoriske ladestoppler
                    </h4>
                    
                    {optimizedStations.filter((station: any) => station.isRequired).map((station: any, index: number) => (
                      <Card key={station.id} className="p-4 glass-card neon-glow border-l-4 border-l-red-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <MapPin className="h-5 w-5 text-primary animate-glow-pulse" />
                               <h5 className="text-lg font-orbitron font-bold text-gradient">{station.name}</h5>
                             </div>
                             
                             <p className="text-sm font-orbitron text-muted-foreground mb-2">{station.location}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Distanse langs ruten</p>
                                 <p className="font-orbitron font-bold text-foreground">{station.distanceAlongRoute?.toFixed(1)} km</p>
                               </div>
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Batteri ved ankomst</p>
                                 <p className="font-orbitron font-bold text-red-600">{station.arrivalBatteryPercentage?.toFixed(1)}%</p>
                               </div>
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Ladetid</p>
                                 <p className="font-orbitron font-bold text-foreground">{station.chargingTime} min</p>
                               </div>
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Kostnad</p>
                                 <p className="font-orbitron font-bold text-foreground">{station.cost} kr/kWh</p>
                               </div>
                            </div>
                            
                            <Badge variant={
                              (station.available / station.total) > 0.5 ? "default" : 
                              station.available > 0 ? "secondary" : "destructive"
                            }>
                              {station.fastCharger ? "⚡ Hurtiglader" : "Standard"}
                            </Badge>
                          </div>
                          
                           <div className="text-right">
                             <div className="text-3xl font-orbitron font-bold text-gradient mb-1">{station.power}</div>
                             <div className="text-sm font-orbitron text-muted-foreground">
                               {station.available}/{station.total} ledige
                             </div>
                           </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Vis valgfrie stasjoner */}
                {optimizedStations.filter((station: any) => !station.isRequired).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xl font-orbitron font-bold text-blue-600 flex items-center gap-2 animate-glow-pulse">
                      🔄 Valgfrie ladestoppler
                    </h4>
                    
                    {optimizedStations.filter((station: any) => !station.isRequired).map((station: any, index: number) => (
                      <Card key={station.id} className="p-4 glass-card cyber-glow border-l-4 border-l-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <MapPin className="h-5 w-5 text-primary animate-glow-pulse" />
                               <h5 className="text-lg font-orbitron font-bold text-gradient">{station.name}</h5>
                             </div>
                             
                             <p className="text-sm font-orbitron text-muted-foreground mb-2">{station.location}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Distanse fra ruten</p>
                                 <p className="font-orbitron font-bold text-foreground">{station.distanceFromRoute?.toFixed(1)} km</p>
                               </div>
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Batteri ved ankomst</p>
                                 <p className="font-orbitron font-bold text-blue-600">{station.arrivalBatteryPercentage?.toFixed(1)}%</p>
                               </div>
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Ladetid</p>
                                 <p className="font-orbitron font-bold text-foreground">{station.chargingTime} min</p>
                               </div>
                               <div>
                                 <p className="text-xs font-orbitron text-muted-foreground">Kostnad</p>
                                 <p className="font-orbitron font-bold text-foreground">{station.cost} kr/kWh</p>
                               </div>
                            </div>
                            
                            <Badge variant={
                              (station.available / station.total) > 0.5 ? "default" : 
                              station.available > 0 ? "secondary" : "destructive"
                            }>
                              {station.fastCharger ? "⚡ Hurtiglader" : "Standard"}
                            </Badge>
                          </div>
                          
                           <div className="text-right">
                             <div className="text-3xl font-orbitron font-bold text-gradient mb-1">{station.power}</div>
                             <div className="text-sm font-orbitron text-muted-foreground">
                               {station.available}/{station.total} ledige
                             </div>
                           </div>
                        </div>
                      </Card>
                    ))}
        </div>
      )}

              </>
            ) : (
              <Card className="p-8 text-center glass-card">
                <Battery className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Ingen lading nødvendig!</h3>
                <p className="text-muted-foreground">
                  Ditt {routeData.batteryPercentage}% batteri holder hele veien til {routeData.to || 'destinasjonen'}.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Du kan likevel velge å lade underveis for ekstra trygghet.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Dialog for interaktiv lading */}
      <Dialog open={showChargingDialog} onOpenChange={setShowChargingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-blue-500" />
              Velg ladeprosent ved {selectedChargingStation?.name}
            </DialogTitle>
            <DialogDescription>
              Hvor mye vil du lade? Dette påvirker hvor de neste blå markørene plasseres.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ladeprosent:</span>
                <span className="text-2xl font-bold text-blue-600">{selectedBatteryPercent}%</span>
              </div>
              
              <Slider
                value={[selectedBatteryPercent]}
                onValueChange={(value) => setSelectedBatteryPercent(value[0])}
                min={30}
                max={100}
                step={5}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30%</span>
                <span>65%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[50, 65, 80, 100].map((percent) => (
                <Button
                  key={percent}
                  variant={selectedBatteryPercent === percent ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBatteryPercent(percent)}
                  className="h-8"
                >
                  {percent}%
                </Button>
              ))}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Estimert rekkevidde:</span>
              </div>
              <p className="text-muted-foreground">
                {selectedBatteryPercent > 10 ? 
                  `Ca. ${Math.round((selectedCar?.range || 380) * (selectedBatteryPercent - 10) / 100)} km til neste kritiske punkt` :
                  'Velg minst 15% for sikker kjøring'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChargingDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleInteractiveCharging}
              disabled={selectedBatteryPercent < 15}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Battery className="h-4 w-4 mr-2" />
              Lad til {selectedBatteryPercent}%
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal for charging percentage input */}
      <Dialog open={chargingModal.isOpen} onOpenChange={(open) => setChargingModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-4 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Battery className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Velg ladeprosent
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {chargingModal.stationName}
              </p>
              <p className="text-xs text-gray-500">
                Batteri ved ankomst: ~{chargingModal.arrivalBattery}%
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ønsket ladeprosent
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={chargingModal.arrivalBattery}
                    max="100"
                    value={chargePercentInput}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('📝 Input changed to:', newValue);
                      setChargePercentInput(newValue);
                      
                      // Oppdater analyse umiddelbart ved endring
                      const chargePercent = parseInt(newValue);
                      if (!isNaN(chargePercent) && chargePercent >= 10 && chargePercent <= 100) {
                        updateAnalysisWithCharging(chargePercent);
                        console.log(`🔄 Analyse oppdatert for ${chargePercent}% lading`);
                      }
                    }}
                    className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-md text-center text-xl font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80"
                  />
                  <span className="text-xl font-bold text-gray-900">%</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setChargingModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button 
                  type="button"
                   onClick={() => {
                     console.log('🎯 Beregn neste punkt knapp klikket!');
                     
                     // ENKEL LØSNING: Finn alle røde markører og gjør den andre til blå
                     const allRedMarkers = document.querySelectorAll('.charging-station-marker');
                     console.log('🔴 Fant', allRedMarkers.length, 'røde markører');
                     
                     if (allRedMarkers.length > 1) {
                       // ENKEL LØSNING: Bruk andre stasjon fra optimizedStations direkte
                       let stationCoords: [number, number] = [10.0, 60.0];
                       let stationName = 'Neste ladestasjon';
                       
                       if (optimizedStations && optimizedStations.length > 1) {
                         // Bruk andre stasjon fra listen
                         const secondStation = optimizedStations[1];
                         stationCoords = [secondStation.longitude, secondStation.latitude];
                         stationName = secondStation.name;
                         console.log('🔵 BRUKER ANDRE STASJON:', stationName, 'på koordinater:', stationCoords);
                       } else if (optimizedStations && optimizedStations.length > 0) {
                         // Fallback til første stasjon hvis det bare er en
                         const firstStation = optimizedStations[0];
                         stationCoords = [firstStation.longitude + 0.1, firstStation.latitude + 0.1]; // Litt offset
                         stationName = firstStation.name + ' (backup)';
                         console.log('🔵 BRUKER FØRSTE STASJON MED OFFSET:', stationName, 'på koordinater:', stationCoords);
                       }
                       
                       const targetMarker = allRedMarkers[1] as HTMLElement;
                       
                       // Fjern den røde markøren
                       targetMarker.remove();
                       console.log('🔴❌ FJERNET RØD MARKØR');
                       
                       // Lag ny stor blå markør på samme koordinater
                       const blueEl = document.createElement('div');
                       blueEl.className = 'next-critical-blue-marker';
                       blueEl.style.cssText = `
                         background: linear-gradient(135deg, #0066ff, #00aaff);
                         width: 40px;
                         height: 40px;
                         border-radius: 50%;
                         border: 4px solid white;
                         cursor: pointer;
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         color: white;
                         font-weight: bold;
                         font-size: 20px;
                         z-index: 999999 !important;
                         position: relative;
                         box-shadow: 0 0 30px rgba(0, 102, 255, 1);
                         animation: pulse 1s infinite;
                       `;
                       blueEl.innerHTML = '⚡';
                       
                       new mapboxgl.Marker(blueEl)
                         .setLngLat(stationCoords)
                         .addTo(map.current!);
                       
                       console.log('🔵✅ NY BLÅ MARKØR LAGT TIL på:', stationCoords);
                       
                       toast({
                         title: `🔵 Neste ladestasjon markert!`,
                         description: `${stationName} er nå markert som neste kritiske ladestasjon!`,
                       });
                       
                       // Lukk modalen
                       setChargingModal({ isOpen: false, stationId: '', stationName: '', distance: 0, arrivalBattery: 0 });
                       
                     } else {
                       console.log('❌ Ikke nok røde markører å konvertere');
                       toast({
                         title: `✅ Ingen flere ladestasjoner nødvendig!`,
                         description: `Du kommer frem uten flere ladestasjoner.`,
                       });
                       
                       // Lukk modalen
                       setChargingModal({ isOpen: false, stationId: '', stationName: '', distance: 0, arrivalBattery: 0 });
                     }
                     
                     const chargePercent = parseInt(chargePercentInput);
                     const currentDistance = chargingModal.distance;
                     
                     // Lukk modalen
                     setChargingModal({ isOpen: false, stationId: '', stationName: '', distance: 0, arrivalBattery: 0 });
                     
                     if (isNaN(chargePercent) || chargePercent < 10 || chargePercent > 100) {
                      toast({
                        title: "❌ Ugyldig batteriprosent",
                        description: "Vennligst angi et tall mellom 10 og 100.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // OPPDATER RUTEANALYSE MED NY LADEPROSENT
                    if (currentRoute && routeData) {
                      const routeDistanceKm = currentRoute.distance / 1000;
                      const routeDurationHours = currentRoute.duration / 3600;
                      
                      // Beregn ny analyse basert på endret lading
                      const newChargingStops = Math.ceil(routeDistanceKm / 350);
                      const newAverageCharge = 45; // litt mindre lading per stopp
                      const carCapacity = selectedCar.batteryCapacity || 75;
                      // SAMME JUSTERTE BEREGNINGER SOM updateAnalysisWithCharging
                      const forbrukPer100km = 18; // kWh/100km
                      const totalEnergi = (routeDistanceKm / 100) * forbrukPer100km;
                      const ladepris = 2.5; // kr/kWh
                      
                      // MINDRE kostnad - kun den energien som faktisk brukes på ladingen
                      const kostnadPerStasjon = Math.round(totalEnergi * ladepris * (chargePercent / 100) * 0.3); // 30% av beregning
                      
                      // Færre stopp - mer realistisk
                      const carRange = selectedCar?.range || 441;
                      const antallStopp = Math.max(1, Math.ceil(routeDistanceKm / (carRange * 0.9))); // 90% utnyttelse
                      const totalKostnad = kostnadPerStasjon * antallStopp;
                      
                      // KORTERE ladetid - mer realistisk for hurtiglading
                      const minutterPerStopp = Math.round(15 + (chargePercent * 0.25)); // 15-40 min
                      const totalLadetid = antallStopp * minutterPerStopp;
                      
                      console.log('🔢 BEREGNING ANDRE FUNKSJON:', {
                        prosent: chargePercent,
                        kostnadPerStasjon,
                        antallStopp,
                        totalKostnad,
                        minutterPerStopp,
                        totalLadetid
                      });
                      
                      const updatedAnalysis = {
                        totalDistance: routeDistanceKm,
                        totalTime: routeDurationHours + (totalLadetid / 60),
                        totalCost: totalKostnad,
                        chargingTime: totalLadetid,
                        co2Saved: Math.round(routeDistanceKm * 0.13),
                        efficiency: 0.88,
                        weather: undefined
                      };
                      
                      setRouteAnalysis(updatedAnalysis);
                      onRouteAnalysisUpdate?.(updatedAnalysis);
                      console.log('✅ OPPDATERT ANALYSE ETTER LADING:', updatedAnalysis);
                      
                      toast({
                        title: "✅ Analyse oppdatert",
                        description: `Ny kostnad: ${totalKostnad} kr med ${chargePercent}% lading`,
                        variant: "default"
                      });
                    }
                    
                    // Beregn hvor langt bilen kan kjøre med ny batteriprosent MINUS 10% buffer
                    const carRange = selectedCar?.range || 487;
                    const usableRange = ((chargePercent - 10) / 100) * carRange * 0.8; // Stopp ved 10% batteri
                    const criticalPointDistance = currentDistance + usableRange; // Hvor batteriet når 10%
                    
                    console.log('🎯 Beregning av kritisk punkt:', {
                      currentDistance,
                      chargePercent,
                      carRange,
                      usableRange,
                      criticalPointDistance
                    });
                    
                    // Finn den nærmeste ladestasjonen til det kritiske punktet
                    let nearestStation = null;
                    let smallestDistance = Infinity;
                    
                    chargingStations.forEach(station => {
                      if (station.distanceAlongRoute && station.distanceAlongRoute > currentDistance) {
                        const distanceFromCriticalPoint = Math.abs(station.distanceAlongRoute - criticalPointDistance);
                        if (distanceFromCriticalPoint < smallestDistance) {
                          smallestDistance = distanceFromCriticalPoint;
                          nearestStation = station;
                        }
                      }
                    });
                    
                    console.log('📍 Nærmeste stasjon til kritisk punkt:', nearestStation?.name, 'avstand fra kritisk punkt:', smallestDistance.toFixed(1), 'km');
                    
                    if (!nearestStation) {
                      toast({
                        title: "❌ Ingen stasjoner funnet",
                        description: "Ingen ladestasjoner funnet nær det kritiske punktet.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                     // Fjern eventuell eksisterende rød markør på samme posisjon
                     const existingMarkers = document.querySelectorAll('.charging-station-marker');
                     existingMarkers.forEach(marker => {
                       const markerElement = marker as HTMLElement;
                       const stationId = markerElement.getAttribute('data-station-id');
                       if (stationId === nearestStation.id) {
                         console.log('🔴➡️🔵 FJERNER EKSISTERENDE RØD MARKØR for:', nearestStation.name);
                         const mapboxMarker = (markerElement as any)._mapboxMarker;
                         if (mapboxMarker) {
                           mapboxMarker.remove();
                         } else {
                           markerElement.remove();
                         }
                       }
                     });

                     // Lag blå markør for den nærmeste ladestasjonen
                     console.log('🔵 LAGER NY BLÅ MARKØR for:', nearestStation.name);
                     console.log('🔵 DENNE STASJONEN ER DEN SOM VISES SOM BLÅ MARKØR:', nearestStation);
                     const el = document.createElement('div');
                    el.className = 'blue-critical-point-marker';
                    el.setAttribute('data-station-id', nearestStation.id);
                    el.setAttribute('data-marker-type', 'critical-point');
                    el.style.cssText = `
                      background: linear-gradient(135deg, #0066ff, #00aaff);
                      width: 25px;
                      height: 25px;
                      border-radius: 50%;
                      border: 3px solid white;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                      z-index: 999999 !important;
                      position: relative;
                      box-shadow: 0 0 20px rgba(0, 102, 255, 0.8);
                      animation: pulse 2s infinite;
                    `;
                    el.innerHTML = '⚡';
                    
                    console.log('🔵 Legger til blå markør på koordinater:', [nearestStation.longitude, nearestStation.latitude]);
                    const marker = new mapboxgl.Marker(el)
                      .setLngLat([nearestStation.longitude, nearestStation.latitude])
                      .addTo(map.current!);
                    
                    console.log('🔵 BLÅ MARKØR LAGT TIL SUCCESSFULLY for:', nearestStation.name);
                    
                    // Send DENNE stasjonen (den som faktisk vises som blå) til ladestasjonkartet
                    console.log('🔵 SENDER BLUE MARKER STATION TIL PARENT:', nearestStation.name);
                    sendStationToChargingMap(nearestStation);
                     
                     console.log('🚨🚨🚨 STARTER NESTE BLÅ MARKØR LOGIKK 🚨🚨🚨');
                     console.log('nearestStation:', nearestStation);
                     console.log('chargePercent:', chargePercent);
                     console.log('currentRoute:', currentRoute);
                     console.log('carRange:', carRange);
                     
                     // Beregn batteriprosent ved ankomst til kritisk punkt
                     const batteryAtCriticalPoint = ((criticalPointDistance - currentDistance) / carRange) * 100;
                     const remainingBattery = chargePercent - batteryAtCriticalPoint;
                     
                     // HOVEDFUNKSJON: Beregn neste kritiske punkt basert på ny batteriprosent
                     console.log('🔥 BEREGNER NESTE KRITISKE PUNKT ETTER LADING:');
                     console.log('  - Lader til:', chargePercent + '%');
                     console.log('  - Nåværende posisjon:', nearestStation.distanceAlongRoute + 'km');
                     console.log('  - Car range:', carRange + 'km');
                     console.log('  - Current route distance:', (currentRoute.distance / 1000).toFixed(1) + 'km');
                     
                     const usableRangeAfterCharging = (carRange * (chargePercent - 15)) / 100; // Rekkevidde til neste 15%
                     const nextCriticalDistance = nearestStation.distanceAlongRoute! + usableRangeAfterCharging;
                     
                     console.log('  - Kan kjøre:', usableRangeAfterCharging.toFixed(1), 'km fra denne stasjonen');
                     console.log('  - Neste kritiske punkt vil være på:', nextCriticalDistance.toFixed(1), 'km');
                     console.log('  - optimizedStations.length:', optimizedStations?.length || 0);
                     
                     // Finn alle RØDE markører som allerede er på kartet
                     const redMarkers = document.querySelectorAll('.charging-station-marker');
                     console.log('🔴 Fant', redMarkers.length, 'røde markører å sjekke');
                     
                     if (redMarkers.length === 0) {
                       console.log('❌ INGEN RØDE MARKØRER FUNNET!');
                       toast({
                         title: `❌ Ingen stasjoner funnet`,
                         description: `Ingen røde markører funnet på kartet å konvertere til blå.`,
                       });
                       return;
                     }
                     
                     // ENKEL LØSNING: Ta den ANDRE røde markøren (ikke den første) og gjør den blå
                     if (redMarkers.length > 1) {
                       const secondRedMarker = redMarkers[1] as HTMLElement;
                       const stationId = secondRedMarker.getAttribute('data-station-id');
                       
                       console.log('🎯 KONVERTERER ANDRE RØDE MARKØR TIL BLÅ');
                       console.log('🎯 Station ID:', stationId);
                       
                       // Fjern den røde markøren
                       secondRedMarker.remove();
                       console.log('🔴❌ FJERNET ANDRE RØDE MARKØR');
                       
                       // Finn koordinater fra optimizedStations eller lag en fallback
                       let stationCoords = null;
                       let stationName = 'Neste ladestasjon';
                       
                       // Prøv å finne stasjonen i optimizedStations
                       if (optimizedStations && optimizedStations.length > 1) {
                         const station = optimizedStations[1];
                         stationCoords = [station.longitude, station.latitude];
                         stationName = station.name;
                         console.log('✅ Fant stasjon i optimizedStations:', stationName);
                       } else {
                         console.log('⚠️ Bruker fallback-koordinater');
                         // Fallback til et punkt lenger sør på ruten
                         stationCoords = [9.0, 60.0]; // Omtrentlig punkt
                       }
                       
                       // LAG NY BLÅ MARKØR
                       console.log('🔵🆕 LAGER NY BLÅ MARKØR for:', stationName);
                       const nextBlueEl = document.createElement('div');
                       nextBlueEl.className = 'next-critical-blue-marker';
                       nextBlueEl.setAttribute('data-station-id', stationId || 'next-station');
                       nextBlueEl.style.cssText = `
                         background: linear-gradient(135deg, #0066ff, #00aaff);
                         width: 35px;
                         height: 35px;
                         border-radius: 50%;
                         border: 4px solid white;
                         cursor: pointer;
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         color: white;
                         font-weight: bold;
                         font-size: 18px;
                         z-index: 999999 !important;
                         position: relative;
                         box-shadow: 0 0 30px rgba(0, 102, 255, 1);
                         animation: pulse 1s infinite;
                       `;
                       nextBlueEl.innerHTML = '⚡';
                       
                       const nextBlueMarker = new mapboxgl.Marker(nextBlueEl)
                         .setLngLat(stationCoords)
                         .addTo(map.current!);
                       
                       console.log('✅✅✅ NESTE BLÅ MARKØR OPPRETTET SUCCESSFULLY!');
                       
                       toast({
                         title: `🔵 Neste ladestasjon markert!`,
                         description: `${stationName} er nå markert som neste kritiske ladestasjon.`,
                       });
                     } else {
                       console.log('⚠️ Kun én rød markør funnet - ingen å konvertere');
                       toast({
                         title: `✅ Ingen flere ladestasjoner nødvendig!`,
                         description: `Med ${chargePercent}% lading kommer du frem uten å lade igjen.`,
                       });
                     }
                     
                     toast({
                       title: `⚡ Lading planlagt!`,
                       description: `Lader til ${chargePercent}% ved ${nearestStation.name}. Batteriet vil være ${remainingBattery.toFixed(0)}% ved ankomst.`,
                     });
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  🎯 Beregn neste punkt
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      
    </div>
  );
};

export default RouteMap;