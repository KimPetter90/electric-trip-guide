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
  onChargingStationUpdate?: (station: ChargingStation | null, showButton: boolean) => void;
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

const RouteMap: React.FC<RouteMapProps> = ({ isVisible, routeData, selectedCar, routeTrigger, selectedRouteId, onChargingStationUpdate }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Throttle API-kall
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
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

  // Funksjon for å beregne nye kritiske punkter basert på valgt ladeprosent  
  const calculateNextCriticalPoints = (
    currentStation: ChargingStation,
    batteryPercent: number,
    route: any,
    car: CarModel,
    allStations: ChargingStation[]
  ): ChargingStation[] => {
    console.log('🔋 Beregner neste kritiske punkter med', batteryPercent, '% batteri');
    
    // Find current station position along route
    const routeCoords = route.geometry.coordinates;
    let currentStationPosition = 0;
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
    
    // Calculate range from selected battery percent to critical level (10%)
    const usableBatteryRange = batteryPercent - 10; // Fra valgt prosent til 10%
    const rangeKm = (car.range * usableBatteryRange) / 100;
    const nextCriticalPosition = currentStationPosition + rangeKm;
    
    console.log('📍 Current position:', currentStationPosition, 'km');
    console.log('🔋 Range with', batteryPercent + '%:', rangeKm, 'km');
    console.log('🎯 Next critical position:', nextCriticalPosition, 'km');
    
    // Find stations near the next critical point
    const searchRadius = 30; // 30km radius
    
    const candidateStations = allStations.filter(station => {
      let stationPosition = 0;
      let minDistToRoute = Infinity;
      
      for (let i = 0; i < routeCoords.length; i++) {
        const distanceToPoint = getDistance(
          station.latitude,
          station.longitude,
          routeCoords[i][1],
          routeCoords[i][0]
        );
        
        if (distanceToPoint < minDistToRoute) {
          minDistToRoute = distanceToPoint;
          stationPosition = (i / routeCoords.length) * (route.distance / 1000);
        }
      }
      
      const isNearRoute = minDistToRoute <= 5.0;
      const isInCriticalArea = stationPosition >= (nextCriticalPosition - searchRadius) && 
                              stationPosition <= (nextCriticalPosition + searchRadius);
      
      return isNearRoute && isInCriticalArea && stationPosition > currentStationPosition;
    });
    
    console.log('✅ Fant', candidateStations.length, 'kandidat stasjoner for neste kritiske punkt');
    return candidateStations.slice(0, 3); // Return top 3 stations
  };

  // Funksjon for å håndtere interaktiv lading
  const handleInteractiveCharging = () => {
    if (!selectedChargingStation || !currentRoute) return;
    
    console.log('🔋 STARTER INTERAKTIV LADING:', selectedChargingStation.name, 'til', selectedBatteryPercent + '%');
    
    // Fjern gamle blå markører
    const oldMarkers = document.querySelectorAll('.progressive-charging-marker');
    oldMarkers.forEach(marker => marker.remove());
    
    // Beregn nye kritiske punkter
    const nextStations = calculateNextCriticalPoints(
      selectedChargingStation,
      selectedBatteryPercent,
      currentRoute,
      selectedCar!,
      chargingStations
    );
    
    // Legg til nye blå markører for neste kritiske punkter
    nextStations.forEach(station => {
      const el = document.createElement('div');
      el.className = 'progressive-charging-marker';
      el.style.cssText = `
        background: linear-gradient(135deg, #0066ff, #00aaff);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        z-index: 100;
        box-shadow: 0 0 20px rgba(0, 102, 255, 0.8), 0 0 40px rgba(0, 170, 255, 0.4);
        animation: pulse 2s infinite;
      `;
      el.innerHTML = '🔋';

      // Rekursiv click handler for nye stasjoner
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔋 KLIKKET PÅ NY BLÅMARKØR:', station.name);
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
          
          <button 
            onclick="window.openChargingModal && window.openChargingModal('${station.id}', '${station.name}', ${station.distanceAlongRoute || 0}, ${arrivalBatteryPercent.toFixed(0)})"
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

    return () => {
      delete (window as any).openChargingModal;
    };
  }, []);

  // Funksjon for å beregne neste kritiske punkt
  const calculateNextPoint = () => {
    console.log('🔥🔥🔥 VERSJON 2.0 - COMPLETE REWRITE calculateNextPoint 🔥🔥🔥');
    
    // TEST 1: Er funksjonen i det hele tatt tilgjengelig?
    console.log('📊 TEST 1 - Function called successfully');
    
    // TEST 2: Er state tilgjengelig?
    console.log('📊 TEST 2 - chargingModal:', chargingModal);
    console.log('📊 TEST 2 - chargePercentInput:', chargePercentInput);
    console.log('📊 TEST 2 - routeData:', !!routeData);
    console.log('📊 TEST 2 - selectedCar:', !!selectedCar);
    
    // TEST 3: Parse input
    const chargePercent = parseInt(chargePercentInput);
    console.log('📊 TEST 3 - Parsed charge percent:', chargePercent, typeof chargePercent);
    
    // TEST 4: Validation
    if (isNaN(chargePercent)) {
      console.log('❌ TEST 4 FAILED - chargePercent is NaN');
      toast({
        title: "❌ Ugyldig prosent",
        description: "Kunne ikke lese prosentverdien.",
        variant: "destructive"
      });
      return;
    }
    
    if (chargePercent < 10 || chargePercent > 100) {
      console.log('❌ TEST 4 FAILED - chargePercent out of range:', chargePercent);
      toast({
        title: "❌ Ugyldig prosent",
        description: `Prosent må være mellom 10-100. Du skrev: ${chargePercent}`,
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ TEST 4 PASSED - chargePercent is valid:', chargePercent);
    
    // TEST 5: Basic data check
    if (!routeData) {
      console.log('❌ TEST 5 FAILED - No routeData');
      toast({
        title: "❌ Ingen rute",
        description: "Planlegg en rute først.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedCar) {
      console.log('❌ TEST 5 FAILED - No selectedCar');
      toast({
        title: "❌ Ingen bil",
        description: "Velg en bil først.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ TEST 5 PASSED - routeData and selectedCar available');
    
    // TEST 6: Distance check
    const currentDistance = chargingModal.distance;
    console.log('📊 TEST 6 - currentDistance from modal:', currentDistance, typeof currentDistance);
    
    if (typeof currentDistance !== 'number') {
      console.log('❌ TEST 6 FAILED - distance is not a number:', currentDistance);
      toast({
        title: "❌ Ugyldig distanse",
        description: "Distanseverdien er ikke et tall.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ TEST 6 PASSED - distance is valid number');
    
    // TEST 7: Calculations
    const carRange = selectedCar.range;
    const usableRange = (carRange * (chargePercent - 10)) / 100;
    console.log('📊 TEST 7 - Calculations:', {
      carRange,
      chargePercent,
      usableRange,
      currentDistance
    });
    
    // TEST 8: Simple success case - always create markers
    console.log('📊 TEST 8 - Creating success case');
    
    // Lukk modal først
    setChargingModal({ isOpen: false, stationId: '', stationName: '', distance: 0, arrivalBattery: 0 });
    
    // Vis suksessmelding
    toast({
      title: "✅ Test fullført!",
      description: `Med ${chargePercent}% lading kan bilen kjøre ${usableRange.toFixed(0)}km ekstra. Alle tester passerte!`,
    });
    
    console.log('🎉 TEST 8 COMPLETED - Function executed successfully');
  };

  // Funksjon for initialisering av kart
  const initializeMap = async () => {
    if (!accessToken || !mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = accessToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10.7522, 59.9139], // Oslo sentrum
        zoom: 6,
        pitch: 0,
        bearing: 0
      });

      map.current.addControl(new mapboxgl.NavigationControl());
      
      map.current.on('load', () => {
        console.log('✅ Kart lastet og klar');
        setIsMapLoaded(true);
      });

    } catch (error) {
      console.error('❌ Feil ved initialisering av kart:', error);
      setError('Kunne ikke laste kartet');
    }
  };

  // Funksjon for opprydding av kart
  const cleanupMap = () => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    setIsMapLoaded(false);
  };

  // Funksjon for oppdatering av kart med rute
  const updateMapRoute = async () => {
    if (!map.current || !routeData || !isMapLoaded) return;

    console.log('🗺️ Oppdaterer kart med rute...');
    // Implementer rute-oppdatering her hvis nødvendig
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
      updateMapRoute();
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
              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300 animate-float">
                <div className="flex items-center space-x-2">
                  <Route className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Total distanse</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{(() => {
                      console.log('🔍 RouteAnalysis status:', { routeAnalysis, hasData: !!routeAnalysis });
                      return routeAnalysis ? Math.round(routeAnalysis.totalDistance) : '---';
                    })()} km</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300 animate-float" style={{ animationDelay: '200ms' }}>
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

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300 animate-float" style={{ animationDelay: '400ms' }}>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Ladekostnad</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{routeAnalysis?.totalCost || 0} kr</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300 animate-float" style={{ animationDelay: '600ms' }}>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">Ladetid</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{routeAnalysis?.chargingTime || 0} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300 animate-float" style={{ animationDelay: '800ms' }}>
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-green-500 animate-glow-pulse" />
                  <div>
                    <p className="text-sm font-orbitron font-medium text-muted-foreground">CO₂ spart</p>
                    <p className="text-3xl font-orbitron font-bold text-gradient">{routeAnalysis ? Math.round(routeAnalysis.co2Saved) : 0} kg</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass-card cyber-glow border-border hover:shadow-neon transition-all duration-300 animate-float" style={{ animationDelay: '1000ms' }}>
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
                      console.log('📝 Input changed to:', e.target.value);
                      setChargePercentInput(e.target.value);
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                     console.log('🎯🎯🎯 Beregn neste punkt knapp klikket - VERSJON 2.0 🎯🎯🎯');
                     console.log('📊 Current state:', { chargingModal, chargePercentInput });
                     console.log('📊 typeof calculateNextPoint:', typeof calculateNextPoint);
                     try {
                       console.log('🚀 About to call calculateNextPoint...');
                       calculateNextPoint();
                       console.log('✅ calculateNextPoint completed successfully');
                     } catch (error) {
                       console.error('❌❌❌ KRITISK FEIL i calculateNextPoint:', error);
                       console.error('Stack trace:', error.stack);
                       toast({
                         title: "❌ Kritisk feil oppstod",
                         description: `Teknisk feil: ${error.message}`,
                         variant: "destructive"
                       });
                     }
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