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
  'lillehammer': [10.4662, 61.1272]
};

// Basis ladestasjoner
const basicChargingStations: ChargingStation[] = [
  {
    id: "fosnavag-tesla",
    name: "Tesla Supercharger Fosnavåg",
    location: "Fosnavåg, Møre og Romsdal",
    latitude: 62.3216,
    longitude: 5.6592,
    available: 8,
    total: 12,
    fastCharger: true,
    power: "250 kW",
    cost: 4.50,
  },
  {
    id: "circle-k-sjoholt",
    name: "Circle K Sjøholt",
    location: "Sjøholt, Møre og Romsdal",
    latitude: 62.2453,
    longitude: 6.1231,
    available: 3,
    total: 4,
    fastCharger: true,
    power: "150 kW",
    cost: 5.20,
  },
  {
    id: "eviny-volda",
    name: "Eviny Volda",
    location: "Volda, Møre og Romsdal",
    latitude: 62.1473,
    longitude: 6.0716,
    available: 2,
    total: 3,
    fastCharger: false,
    power: "50 kW",
    cost: 3.80,
  },
  {
    id: "mer-hornindal",
    name: "Mer Hornindal",
    location: "Hornindal, Vestland",
    latitude: 61.9642,
    longitude: 6.5331,
    available: 4,
    total: 6,
    fastCharger: true,
    power: "175 kW",
    cost: 4.90,
  },
  {
    id: "tesla-supercharger-stryn",
    name: "Tesla Supercharger Stryn",
    location: "Stryn, Vestland",
    latitude: 61.9115,
    longitude: 6.7156,
    available: 6,
    total: 8,
    fastCharger: true,
    power: "250 kW",
    cost: 4.50,
  }
];

async function fetchNorwegianChargingStations(): Promise<ChargingStation[]> {
  const extendedStations: ChargingStation[] = [
    ...basicChargingStations,
    {
      id: "circle-k-geiranger",
      name: "Circle K Geiranger",
      location: "Geiranger, Møre og Romsdal",
      latitude: 62.1015,
      longitude: 7.2066,
      available: 2,
      total: 4,
      fastCharger: true,
      power: "150 kW",
      cost: 5.20,
    },
    {
      id: "eviny-alesund",
      name: "Eviny Ålesund",
      location: "Ålesund, Møre og Romsdal",
      latitude: 62.4722,
      longitude: 6.1575,
      available: 5,
      total: 8,
      fastCharger: true,
      power: "175 kW",
      cost: 4.80,
    },
    {
      id: "tesla-supercharger-molde",
      name: "Tesla Supercharger Molde",
      location: "Molde, Møre og Romsdal",
      latitude: 62.7378,
      longitude: 7.1574,
      available: 7,
      total: 10,
      fastCharger: true,
      power: "250 kW",
      cost: 4.50,
    },
    {
      id: "fortum-kristiansund",
      name: "Fortum Kristiansund",
      location: "Kristiansund, Møre og Romsdal",
      latitude: 63.1109,
      longitude: 7.7285,
      available: 3,
      total: 6,
      fastCharger: true,
      power: "150 kW",
      cost: 5.00,
    },
    {
      id: "mer-trondheim",
      name: "Mer Trondheim",
      location: "Trondheim, Trøndelag",
      latitude: 63.4305,
      longitude: 10.3951,
      available: 8,
      total: 12,
      fastCharger: true,
      power: "300 kW",
      cost: 5.50,
    }
  ];
  
  return extendedStations;
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

const RouteMap: React.FC<RouteMapProps> = ({ isVisible, routeData, selectedCar }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<string>("analysis");
  const { toast } = useToast();

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
        setError('Kunne ikke hente Mapbox-token');
      }
    };

    fetchMapboxToken();
  }, []);

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

  // Funksjon for å konvertere stedsnavn til koordinater
  const getCoordinatesForPlace = async (place: string): Promise<[number, number] | null> => {
    const lowerPlace = place.toLowerCase().trim();
    
    if (cityCoordinates[lowerPlace]) {
      return cityCoordinates[lowerPlace];
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${accessToken}&country=NO&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
    } catch (error) {
      console.error('Geocoding feil:', error);
    }
    
    return null;
  };

  // Oppdater kart med rute
  const updateMapRoute = async () => {
    if (!map.current || !accessToken || !routeData.from || !routeData.to) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Henter koordinater for start og slutt...');
      const startCoords = await getCoordinatesForPlace(routeData.from);
      const endCoords = await getCoordinatesForPlace(routeData.to);

      if (!startCoords || !endCoords) {
        throw new Error('Kunne ikke finne koordinater for start eller slutt');
      }

      console.log(`Start: ${routeData.from} -> ${startCoords}`);
      console.log(`Slutt: ${routeData.to} -> ${endCoords}`);

      // Hent værdata før ruteberegning
      console.log('🌤️ Henter værdata...');
      const weatherData = await fetchWeatherData(startCoords, endCoords);
      console.log('✅ Værdata hentet:', weatherData);

      // Få rute fra Mapbox Directions API
      console.log('Henter rute fra Mapbox Directions API...');
      
      console.log('🔍 RouteAnalysis status:', { routeAnalysis, hasData: !!routeAnalysis });
      
      const waypoints = [startCoords, endCoords];
      const coordinates = waypoints.map(coord => coord.join(',')).join(';');
      
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${accessToken}`;
      
      const directionsResponse = await fetch(directionsUrl);
      const directionsData = await directionsResponse.json();

      if (!directionsData.routes || directionsData.routes.length === 0) {
        throw new Error('Ingen rute funnet');
      }

      const route = directionsData.routes[0];
      const routeDistance = route.distance / 1000; // Konverter til km
      const routeDuration = route.duration / 3600; // Konverter til timer

      console.log('Rute mottatt fra Mapbox:', { distance: routeDistance, duration: route.duration });

      // Cleanup eksisterende rute og markører
      console.log('🧹 Eksplisitt cleanup før ny rute...');
      cleanupMap();

      // Legg til ny rute
      console.log('➕ Legger til ny route source...');
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
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });

      // Rydd opp markører først
      console.log('🧹 KRAFTIG CLEANUP - fjerner alle markører...');
      const allMarkers = document.querySelectorAll('.mapboxgl-marker');
      allMarkers.forEach(marker => marker.remove());
      console.log('🧹 Cleanup fullført - starter på nytt...');

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
      console.log('Optimaliserer ladestasjoner...');
      const optimized = optimizeChargingStations(
        route.geometry.coordinates,
        routeDistance,
        selectedCar,
        routeData.batteryPercentage,
        chargingStations
      );

      setOptimizedStations(optimized);

      // Legg til markører for optimerte ladestasjoner
      console.log('⚡ Sjekker ladestasjoner...');
      console.log('📊 Antall optimerte stasjoner:', optimized.length);
      
      optimized.forEach((station, index) => {
        const el = document.createElement('div');
        el.className = 'charging-station-marker';
        el.style.cssText = `
          background-color: ${station.isRequired ? '#ef4444' : '#f59e0b'};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
        `;
        el.innerHTML = '⚡';

        const popup = new mapboxgl.Popup().setHTML(`
          <strong>${station.name}</strong><br/>
          <em>${station.location}</em><br/>
          📍 ${station.distanceFromRoute?.toFixed(1)} km langs ruten<br/>
          🔋 Batterinivå ved ankomst: ${station.arrivalBatteryPercentage?.toFixed(1)}%<br/>
          ${station.isRequired ? '⚠️ <strong>Obligatorisk ladestasjon</strong>' : '🔄 Valgfri ladestasjon'}<br/>
          ⚡ ${station.power} | 💰 ${station.cost} kr/kWh<br/>
          📊 ${station.available}/${station.total} tilgjengelige
        `);

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Tilpass kart til å vise hele ruten
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(startCoords);
      bounds.extend(endCoords);
      optimized.forEach(station => {
        bounds.extend([station.longitude, station.latitude]);
      });

      map.current!.fitBounds(bounds, { padding: 50 });

      // Beregn analyse
      console.log('Beregner analyse...');
      const analysis = calculateTripAnalysis(routeDistance, routeDuration, optimized, weatherData);
      setRouteAnalysis(analysis);
      console.log('✅ Trip analysis calculated:', analysis);
      console.log('✅ Route analysis set successfully:', analysis);

    } catch (error) {
      console.error('Feil ved oppdatering av rute:', error);
      setError(`Kunne ikke oppdatere ruten: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    } finally {
      setLoading(false);
    }
  };

  // Optimaliser ladestasjoner
  const optimizeChargingStations = (
    routeCoordinates: number[][],
    routeDistance: number,
    car: CarModel,
    batteryPercentage: number,
    availableStations: ChargingStation[]
  ): ChargingStation[] => {
    console.log('🚀 OPTIMIZE CHARGING STATIONS KALT!');
    console.log('📊 BATTERIPROSENT INPUT:', batteryPercentage, '%');
    console.log('📊 RouteDistance:', routeDistance, 'km');
    
    // Tidsstempel for debugging
    const now = new Date();
    console.log('🕐 Tidsstempel:', now.toLocaleTimeString());

    const minBatteryReserve = 10; // Minimum 10% reserve
    const maxChargingLevel = 80; // Lad til maks 80%
    const maxDetourDistance = 10; // Maks 10km avvik fra ruten
    const maxStationsToShow = 5; // Vis maks 5 stasjoner

    console.log('🔋 DETALJERT BEREGNING:');
    console.log('   - Start batteri:', batteryPercentage + '%');
    console.log('   - Bil rekkevidde:', car.range + 'km');
    console.log('   - Rutelengde:', routeDistance + 'km');

    // Beregn hvor langt bilen kan kjøre med gjeldende batteri
    const usableBatteryPercentage = batteryPercentage - minBatteryReserve;
    const drivableDistance = (usableBatteryPercentage / 100) * car.range;

    console.log('🧮 STEG-FOR-STEG:');
    console.log('   1. Batteri tilgjengelig:', batteryPercentage + '% - ' + minBatteryReserve + '% = ' + usableBatteryPercentage + '%');
    console.log('   2. Kjøredistanse med ' + usableBatteryPercentage + '%: (' + usableBatteryPercentage + '/100) × ' + car.range + 'km = ' + drivableDistance.toFixed(1) + 'km');
    console.log('   3. Sammenligning:', drivableDistance.toFixed(1) + 'km VS ' + routeDistance.toFixed(1) + 'km');
    console.log('   4. Batteriet holder hele veien?', drivableDistance >= routeDistance ? 'JA' : 'NEI');

    // Hvis batteriet holder hele veien, returner tom liste
    if (drivableDistance >= routeDistance) {
      console.log('✅ BATTERIET HOLDER HELE VEIEN!');
      return [];
    }

    console.log('🚨 BATTERIET NÅR ' + minBatteryReserve + '% VED ' + drivableDistance.toFixed(1) + 'km av ' + routeDistance.toFixed(1) + 'km');

    // Finn point hvor batteriet når minimum reserve
    const criticalPoint = drivableDistance;
    console.log('📍 LETER ETTER LADESTASJONER NÆR ' + criticalPoint.toFixed(1) + 'km...');

    // Finn stasjoner langs ruten
    const stationsAlongRoute = availableStations
      .map(station => {
        // Finn nærmeste punkt på ruten til stasjonen
        let minDistance = Infinity;
        let closestPointIndex = 0;
        let distanceAlongRoute = 0;

        for (let i = 0; i < routeCoordinates.length - 1; i++) {
          const distance = getDistance(
            station.latitude,
            station.longitude,
            routeCoordinates[i][1],
            routeCoordinates[i][0]
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = i;
          }
        }

        // Beregn distanse langs ruten til nærmeste punkt
        for (let i = 0; i < closestPointIndex; i++) {
          distanceAlongRoute += getDistance(
            routeCoordinates[i][1],
            routeCoordinates[i][0],
            routeCoordinates[i + 1][1],
            routeCoordinates[i + 1][0]
          );
        }

        return {
          ...station,
          distanceFromRoute: minDistance,
          distanceAlongRoute: distanceAlongRoute
        };
      })
      .filter(station => station.distanceFromRoute <= maxDetourDistance)
      .slice(0, maxStationsToShow);

    console.log('📍 Fant', stationsAlongRoute.length, 'stasjoner langs ruten (maks', maxStationsToShow + ', innen', maxDetourDistance + 'km)');

    const optimizedStations: ChargingStation[] = [];
    let currentBatteryLevel = batteryPercentage;
    let currentDistance = 0;

    console.log('🔍 Fant', stationsAlongRoute.length, 'stasjoner langs ruten totalt');

    // Sorter stasjoner etter distanse langs ruten
    stationsAlongRoute.sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute);

    // Finn stasjoner før kritisk punkt
    const stationsBeforeCritical = stationsAlongRoute.filter(station => {
      const batteryAtStation = batteryPercentage - (station.distanceAlongRoute / car.range) * 100;
      const diffFromMinReserve = batteryAtStation - minBatteryReserve;
      
      console.log('🔍', station.name + ':', station.distanceAlongRoute.toFixed(1) + 'km, batteri:', batteryAtStation.toFixed(1) + '%, diff fra ' + minBatteryReserve + '%:', diffFromMinReserve.toFixed(1) + '%');
      
      return batteryAtStation >= minBatteryReserve && batteryAtStation <= 50; // Stasjoner hvor vi har 10-50% batteri
    });

    console.log('📍 Etter filtrering:', stationsBeforeCritical.length, 'egnede stasjoner (0-50% batteri ved ankomst)');

    if (stationsBeforeCritical.length > 0) {
      // Velg stasjonen med lavest batteri ved ankomst (nærmest kritisk punkt)
      const bestStation = stationsBeforeCritical.reduce((best, current) => {
        const bestBattery = batteryPercentage - (best.distanceAlongRoute / car.range) * 100;
        const currentBattery = batteryPercentage - (current.distanceAlongRoute / car.range) * 100;
        return currentBattery < bestBattery ? current : best;
      });

      const arrivalBattery = batteryPercentage - (bestStation.distanceAlongRoute / car.range) * 100;
      
      console.log('🏆 BESTE STASJON:', bestStation.name, 'med', arrivalBattery.toFixed(1) + '% batteri ved ankomst');
      console.log('🎯 VALGT:', bestStation.name, 'ved', bestStation.distanceAlongRoute.toFixed(1) + 'km');
      console.log('   - Batteriprosent ved ankomst:', arrivalBattery.toFixed(1) + '%');
      console.log('   - Type: OBLIGATORISK lading');

      optimizedStations.push({
        ...bestStation,
        arrivalBatteryPercentage: arrivalBattery,
        targetBatteryPercentage: maxChargingLevel,
        isRequired: true,
        chargingTime: calculateChargingTime(arrivalBattery, maxChargingLevel, bestStation.fastCharger)
      });

      currentBatteryLevel = maxChargingLevel;
      currentDistance = bestStation.distanceAlongRoute;

      // Sjekk om vi trenger flere stasjoner
      const remainingDistance = routeDistance - currentDistance;
      const rangeAfterCharging = (currentBatteryLevel - minBatteryReserve) / 100 * car.range;
      
      console.log('🔄 SJEKKER OM VI TRENGER FLERE STASJONER:');
      console.log('   - Gjenstående rute etter første stasjon:', remainingDistance.toFixed(1) + 'km');
      console.log('   - Med ' + currentBatteryLevel + '% batteri kan vi kjøre:', rangeAfterCharging.toFixed(1) + 'km til ' + minBatteryReserve + '%');

      if (remainingDistance > rangeAfterCharging) {
        console.log('🚨 TRENGER EN STASJON TIL!');
        // Her kan vi legge til logikk for flere stasjoner hvis nødvendig
      }
    }

    console.log('📊 RESULTAT:', optimizedStations.length, 'ladestasjoner nødvendig');
    
    optimizedStations.forEach((station, index) => {
      console.log('📍 Stasjon', (index + 1) + ':', station.name, 'på', station.distanceAlongRoute?.toFixed(1) + 'km -', station.arrivalBatteryPercentage?.toFixed(1) + '% →', station.targetBatteryPercentage?.toFixed(1) + '%');
    });

    console.log('🔍 RESULTAT fra optimizeChargingStations:', optimizedStations.length, 'stasjoner');
    return optimizedStations;
  };

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
    const totalChargingTime = stations.reduce((sum, station) => sum + (station.chargingTime || 0), 0);
    const totalCost = stations.reduce((sum, station) => {
      const chargingAmount = ((station.targetBatteryPercentage || 80) - (station.arrivalBatteryPercentage || 20)) / 100 * selectedCar.batteryCapacity;
      return sum + (chargingAmount * station.cost);
    }, 0);

    // CO2-besparelse sammenlignet med bensinbil (ca 120g CO2/km)
    const co2Saved = distance * 0.12; // kg CO2

    // Effektivitet basert på værforhold og rute
    const weatherFactor = weatherData?.rangeFactor || 1;
    const efficiency = weatherFactor * 0.8; // Base effektivitet 80%

    return {
      totalDistance: distance,
      totalTime: timeHours + (totalChargingTime / 60), // Legg til ladetid
      totalCost: Math.round(totalCost),
      chargingTime: totalChargingTime,
      co2Saved: co2Saved,
      efficiency: efficiency,
      weather: weatherData
    };
  };

  // Hent værdata
  const fetchWeatherData = async (startCoords: [number, number], endCoords: [number, number]): Promise<WeatherData> => {
    try {
      const { data, error } = await supabase.functions.invoke('weather-service', {
        body: {
          startLat: startCoords[1],
          startLon: startCoords[0],
          endLat: endCoords[1],
          endLon: endCoords[0]
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Feil ved henting av værdata:', error);
      // Returner dummy værdata
      return {
        startWeather: {
          temperature: 15,
          windSpeed: 10,
          windDirection: 180,
          humidity: 70,
          weatherCondition: "Clear",
          visibility: 10
        },
        endWeather: {
          temperature: 15,
          windSpeed: 10,
          windDirection: 180,
          humidity: 70,
          weatherCondition: "Clear",
          visibility: 10
        },
        averageConditions: {
          temperature: 15,
          windSpeed: 10,
          humidity: 70
        },
        rangeFactor: 1.0
      };
    }
  };

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
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isVisible, accessToken]); // Legg til accessToken som dependency

  // Effekt for lasting av ladestasjoner
  useEffect(() => {
    const loadChargingStations = async () => {
      try {
        const stations = await fetchNorwegianChargingStations();
        setChargingStations(stations);
      } catch (error) {
        console.error('Feil ved lasting av ladestasjoner:', error);
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

        <div className="flex items-center justify-center">
          <Button 
            onClick={updateMapRoute}
            disabled={loading || !routeData.from || !routeData.to}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? 'Planlegger...' : 'Planlegg rute'}
          </Button>
        </div>
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
                    <p className="text-2xl font-bold text-foreground">
                      {routeAnalysis ? `${Math.floor(routeAnalysis.totalTime)}t ${Math.round((routeAnalysis.totalTime % 1) * 60)}m` : '---'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ladekostnad</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis?.totalCost || 0} kr</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ladetid</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis?.chargingTime || 0} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CO₂ spart</p>
                    <p className="text-2xl font-bold text-foreground">{routeAnalysis ? Math.round(routeAnalysis.co2Saved) : 0} kg</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Effektivitet</p>
                    <p className="text-2xl font-bold text-foreground">
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
                    <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                      ⚠️ Obligatoriske ladestoppler
                    </h4>
                    
                    {optimizedStations.filter((station: any) => station.isRequired).map((station: any, index: number) => (
                      <Card key={station.id} className="p-4 glass-card neon-glow border-l-4 border-l-red-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <h5 className="font-semibold text-foreground">{station.name}</h5>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">{station.location}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Distanse langs ruten</p>
                                <p className="font-medium">{station.distanceAlongRoute?.toFixed(1)} km</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Batteri ved ankomst</p>
                                <p className="font-medium text-red-600">{station.arrivalBatteryPercentage?.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Ladetid</p>
                                <p className="font-medium">{station.chargingTime} min</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Kostnad</p>
                                <p className="font-medium">{station.cost} kr/kWh</p>
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
                            <div className="text-2xl font-bold text-primary mb-1">{station.power}</div>
                            <div className="text-sm text-muted-foreground">
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
                    <h4 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                      🔄 Valgfrie ladestoppler
                    </h4>
                    
                    {optimizedStations.filter((station: any) => !station.isRequired).map((station: any, index: number) => (
                      <Card key={station.id} className="p-4 glass-card cyber-glow border-l-4 border-l-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <h5 className="font-semibold text-foreground">{station.name}</h5>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">{station.location}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Distanse fra ruten</p>
                                <p className="font-medium">{station.distanceFromRoute?.toFixed(1)} km</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Batteri ved ankomst</p>
                                <p className="font-medium text-blue-600">{station.arrivalBatteryPercentage?.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Ladetid</p>
                                <p className="font-medium">{station.chargingTime} min</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Kostnad</p>
                                <p className="font-medium">{station.cost} kr/kWh</p>
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
                            <div className="text-2xl font-bold text-primary mb-1">{station.power}</div>
                            <div className="text-sm text-muted-foreground">
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
              </Card>
            )}
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RouteMap;