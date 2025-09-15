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
  routeTrigger?: number;
  selectedRouteId?: string | null;
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

const RouteMap: React.FC<RouteMapProps> = ({ isVisible, routeData, selectedCar, routeTrigger, selectedRouteId }) => {
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
        setError('Kunne ikke hente karttoken');
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
  const updateMapRoute = async (routeType: string = 'fastest') => {
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

      // Få rute fra Mapbox Directions API med forskjellige profiler
      console.log('Henter rute fra Mapbox Directions API...');
      console.log('🔍 RouteAnalysis status:', { routeAnalysis, hasData: !!routeAnalysis });
      console.log('🎯 Valgt rutetype:', routeType);
      
      const waypoints = [startCoords, endCoords];
      const coordinates = waypoints.map(coord => coord.join(',')).join(';');
      
      // Velg riktig Mapbox profil og parametre basert på rutetype
      let mapboxProfile = 'driving';
      let routeParams = 'geometries=geojson&access_token=' + accessToken + '&alternatives=true&continue_straight=false';
      
      switch (routeType) {
        case 'fastest':
          mapboxProfile = 'driving-traffic'; // Raskeste med trafikk
          routeParams += '&steps=true&annotations=duration&exclude=ferry';
          break;
        case 'shortest':
          mapboxProfile = 'driving'; // Standard driving
          routeParams += '&steps=true&annotations=distance&overview=full';
          break;
        case 'eco':
          mapboxProfile = 'driving'; // Eco-vennlig
          routeParams += '&steps=true&annotations=duration,distance&overview=full&exclude=toll';
          break;
        default:
          mapboxProfile = 'driving';
          routeParams += '&steps=true&alternatives=true';
      }
      
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${mapboxProfile}/${coordinates}?${routeParams}`;
      console.log('🌐 API URL for', routeType + ':', directionsUrl.split('?')[0] + '?[params]');
      
      const directionsResponse = await fetch(directionsUrl);
      const directionsData = await directionsResponse.json();

      if (!directionsData.routes || directionsData.routes.length === 0) {
        throw new Error('Ingen rute funnet');
      }

      // Velg riktig rute basert på type med mer intelligent logikk
      let selectedRoute = directionsData.routes[0];
      console.log('📊 Antall tilgjengelige ruter fra Mapbox:', directionsData.routes.length);
      
      if (directionsData.routes.length > 1) {
        console.log('🔍 Analyserer ruter:');
        directionsData.routes.forEach((route, index) => {
          console.log(`  Rute ${index + 1}: ${(route.distance/1000).toFixed(1)}km, ${(route.duration/3600).toFixed(1)}t`);
        });
        
        switch (routeType) {
          case 'fastest':
            // Finn ruten med korteste varighet
            selectedRoute = directionsData.routes.reduce((fastest, current) => 
              current.duration < fastest.duration ? current : fastest
            );
            console.log('⚡ Valgte raskeste rute:', (selectedRoute.distance/1000).toFixed(1) + 'km');
            break;
          case 'shortest':
            // Finn ruten med korteste distanse
            selectedRoute = directionsData.routes.reduce((shortest, current) => 
              current.distance < shortest.distance ? current : shortest
            );
            console.log('📏 Valgte korteste rute:', (selectedRoute.distance/1000).toFixed(1) + 'km');
            break;
          case 'eco':
            // For eco, velg ruten som IKKE er raskest (typisk lengre men mer effektiv)
            const fastest = directionsData.routes.reduce((fastest, current) => 
              current.duration < fastest.duration ? current : fastest
            );
            // Velg en annen rute enn den raskeste
            selectedRoute = directionsData.routes.find(route => route !== fastest) || directionsData.routes[1] || fastest;
            console.log('🌱 Valgte miljøvennlig rute:', (selectedRoute.distance/1000).toFixed(1) + 'km');
            break;
        }
      } else {
        console.log('⚠️ Kun én rute tilgjengelig fra Mapbox - bruker forskjellige profiler for variasjon');
      }

      const route = selectedRoute;
      const routeDistance = route.distance / 1000; // Konverter til km
      const routeDuration = route.duration / 3600; // Konverter til timer

      console.log('🎯 Valgt rute detaljer:', { 
        type: routeType, 
        distance: routeDistance + 'km', 
        duration: routeDuration + 't',
        totalRoutes: directionsData.routes.length 
      });

      // FØRST: Cleanup eksisterende rute og markører GRUNDIG
      console.log('🧹 GRUNDIG CLEANUP - fjerner alt eksisterende innhold...');
      
      // Fjern alle markører
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());
      
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
      const optimized = optimizeChargingStations(
        route.geometry.coordinates,
        routeDistance,
        selectedCar,
        routeData.batteryPercentage,
        chargingStations
      );

      console.log('✅ Optimalisering fullført. Funnet', optimized.length, 'ladestsjoner');
      setOptimizedStations(optimized);

      // FØRST: Legg til ALLE ladestasjoner med fargekoding basert på avstand til rute
      console.log('🟢🔴 LEGGER TIL ALLE LADESTASJONER MED AVSTANDSBASERT FARGEKODING...');
      console.log('📊 Totalt antall ladestasjoner:', chargingStations.length);
      
      const mapRouteCoords = route.geometry.coordinates;
      
      chargingStations.forEach((station, index) => {
        // Beregn korteste avstand fra stasjon til ruten
        let minDistance = Infinity;
        for (let i = 0; i < mapRouteCoords.length; i++) {
          const distance = getDistance(
            station.latitude,
            station.longitude,
            mapRouteCoords[i][1],
            mapRouteCoords[i][0]
          );
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
        
        // Legg til avstand som property på stasjonen for senere bruk
        (station as any).distanceToRoute = minDistance;
        
        // Bestem farge basert på avstand: Rød hvis innenfor 5 km, grønn ellers
        const isNearRoute = minDistance <= 5.0; // 5 km
        
        const el = document.createElement('div');
        el.className = isNearRoute ? 'near-route-station-marker' : 'all-charging-station-marker';
        
        if (isNearRoute) {
          // Helrød markør med lyn for stasjoner nær ruten
          el.style.cssText = `
            background-color: #ef4444;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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

        const popup = new mapboxgl.Popup().setHTML(`
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h4 style="margin: 0 0 8px 0; color: ${isNearRoute ? '#dc2626' : '#00aa33'};"><strong>${isNearRoute ? '🔴' : '🟢'} ${station.name}</strong></h4>
            <p style="margin: 4px 0; color: #666;"><em>📍 ${station.location}</em></p>
            <p style="margin: 4px 0; color: #333;">🛣️ <strong>Avstand til rute:</strong> ${minDistance.toFixed(1)} km</p>
            ${isNearRoute ? '<p style="margin: 4px 0; color: #dc2626;"><strong>🔴 Nær ruten (< 5 km)</strong></p>' : ''}
            <p style="margin: 4px 0; color: #333;">⚡ <strong>Effekt:</strong> ${station.power}</p>
            <p style="margin: 4px 0; color: #333;">💰 <strong>Pris:</strong> ${station.cost} kr/kWh</p>
            <p style="margin: 4px 0; color: #333;">📊 <strong>Tilgjengelig:</strong> ${station.available}/${station.total} ladepunkter</p>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        
        if (index < 10) {
          console.log(`${isNearRoute ? '🔴' : '🟢'} MARKØR ${index + 1}: ${station.name} (${minDistance.toFixed(1)}km)`);
        }
      });
      
      // Finn de mest effektive stasjonene (blå markører)
      const nearRouteStations = chargingStations.filter(station => 
        (station as any).distanceToRoute <= 5.0
      );
      
      console.log('🔵 ANALYSERER EFFEKTIVITET FOR', nearRouteStations.length, 'STASJONER NÆR RUTEN...');
      console.log('  - Startbatteri:', routeData.batteryPercentage + '%');
      console.log('  - Bil rekkevidde:', selectedCar.range + 'km');
      console.log('  - Rutelengde:', routeDistance.toFixed(1) + 'km');
      
      // Beregn effektivitetsscore for stasjoner nær ruten
      const stationsWithScore = nearRouteStations.map(station => {
        const distance = (station as any).distanceToRoute;
        const cost = station.cost;
        const availability = station.available / station.total;
        const powerValue = station.fastCharger ? 2 : 1;
        
        // Effektivitetsscore (lavere er bedre)
        const efficiencyScore = (distance * 0.4) + (cost * 3 * 0.3) + ((1 - availability) * 5 * 0.2) + ((2 - powerValue) * 0.1);
        
        return {
          ...station,
          efficiencyScore
        };
      });
      
      // Sorter etter beste score og ta de 3 beste
      const bestStations = stationsWithScore
        .sort((a, b) => a.efficiencyScore - b.efficiencyScore)
        .slice(0, 3);
      
      console.log('🎯 FANT DE 3 MEST EFFEKTIVE STASJONENE:');
      bestStations.forEach((station, index) => {
        console.log(`  ${index + 1}. ${station.name} (Score: ${station.efficiencyScore.toFixed(2)})`);
      });
      
      console.log('🔵 LEGGER TIL BLÅ MARKØRER FOR MEST EFFEKTIVE STASJONER...');
      
      // Legg til blå markører for de mest effektive stasjonene
      bestStations.forEach((station, index) => {
        const el = document.createElement('div');
        el.className = 'best-efficiency-station-marker';
        el.style.cssText = `
          background-color: #0066ff;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 3px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
          z-index: 10;
          box-shadow: 0 0 10px rgba(0, 102, 255, 0.5);
        `;
        el.innerHTML = '⭐';

        const popup = new mapboxgl.Popup().setHTML(`
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h4 style="margin: 0 0 8px 0; color: #0066ff;"><strong>🔵 MEST EFFEKTIV #${index + 1}: ${station.name}</strong></h4>
            <p style="margin: 4px 0; color: #666;"><em>📍 ${station.location}</em></p>
            <p style="margin: 4px 0; color: #333;">🛣️ <strong>Avstand til rute:</strong> ${(station as any).distanceToRoute.toFixed(1)} km</p>
            <p style="margin: 4px 0; color: #0066ff;"><strong>⭐ Effektivitetsscore:</strong> ${station.efficiencyScore.toFixed(2)}</p>
            <p style="margin: 4px 0; color: #0066ff;"><strong>🔵 Optimal valg for ruten!</strong></p>
            <p style="margin: 4px 0; color: #333;">⚡ <strong>Effekt:</strong> ${station.power}</p>
            <p style="margin: 4px 0; color: #333;">💰 <strong>Pris:</strong> ${station.cost} kr/kWh</p>
            <p style="margin: 4px 0; color: #333;">📊 <strong>Tilgjengelig:</strong> ${station.available}/${station.total} ladepunkter</p>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        
        console.log(`🔵 BLÅ MARKØR ${index + 1}: ${station.name} - MEST EFFEKTIV!`);
      });
      
      const nearRouteCount = nearRouteStations.length;
      console.log(`✅ ALLE ${chargingStations.length} MARKØRER LAGT TIL! (${nearRouteCount} røde innenfor 5km, ${chargingStations.length - nearRouteCount} grønne, ${bestStations.length} blå mest effektive)`);

      // DERETTER: Legg til markører for optimerte ladestasjoner (større og mer synlige)
      console.log('⚡ LEGGER TIL ANBEFALTE STASJONER...');
      console.log('📊 Antall anbefalte stasjoner:', optimized.length);
      
      if (optimized.length === 0) {
        console.log('🚫 INGEN ANBEFALTE STASJONER Å VISE');
      }
      
      optimized.forEach((station, index) => {
        // ALLE optimerte stasjoner som er valgt for ruten får røde markører
        console.log('🔴 Rød rutemarkør for:', station.name);
        const el = document.createElement('div');
        el.className = 'charging-station-marker';
        el.style.cssText = `
          background-color: #ff0000;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
          z-index: 10;
        `;
        el.innerHTML = '⚡';

        const popup = new mapboxgl.Popup().setHTML(`
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h4 style="margin: 0 0 8px 0; color: #dc2626;"><strong>🔴 RUTE-STASJON: ${station.name}</strong></h4>
            <p style="margin: 4px 0; color: #666;"><em>📍 ${station.location}</em></p>
            <p style="margin: 4px 0; color: #333;">🛣️ <strong>Avstand langs ruten:</strong> ${station.distanceFromRoute?.toFixed(1)} km</p>
            <p style="margin: 4px 0; color: #333;">🔋 <strong>Batterinivå ved ankomst:</strong> ${station.arrivalBatteryPercentage?.toFixed(1)}%</p>
            <p style="margin: 4px 0; color: #dc2626;">
              🔴 <strong>Optimert for din rute!</strong>
            </p>
            <p style="margin: 4px 0; color: #333;">⚡ <strong>Effekt:</strong> ${station.power}</p>
            <p style="margin: 4px 0; color: #333;">💰 <strong>Pris:</strong> ${station.cost} kr/kWh</p>
            <p style="margin: 4px 0; color: #333;">📊 <strong>Tilgjengelig:</strong> ${station.available}/${station.total} ladepunkter</p>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        
        console.log('ℹ️ Optimerte stasjoner (lyn-markører) er nå erstattet med avstandsbaserte røde markører');
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

      // Beregn analyse
      console.log('Beregner analyse...');
      const analysis = calculateTripAnalysis(routeDistance, routeDuration, optimized, weatherData);
      setRouteAnalysis(analysis);
      console.log('✅ Trip analysis calculated:', analysis);
      console.log('✅ Route analysis set successfully:', analysis);

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
      }, 500);

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
    console.log('📊 Car range:', car.range, 'km');
    console.log('📊 Tilgjengelige stasjoner INPUT:', availableStations.length);
    console.log('📊 Første 3 stasjoner:', availableStations.slice(0, 3).map(s => s.name));
    
    const criticalBatteryLevel = 10; // Kritisk batterinivå på 10%
    const maxChargingLevel = 80; // Lad til maks 80%
    const maxDetourDistance = 3; // KUN 3km avvik fra ruten for å være rød
    const maxStationsToShow = 100; // Økt igjen for å fange alle stasjoner på ruten

    console.log('🔋 DETALJERT BEREGNING:');
    console.log('   - Start batteri:', batteryPercentage + '%');
    console.log('   - Kritisk nivå:', criticalBatteryLevel + '%');
    console.log('   - Bil rekkevidde:', car.range + 'km');
    console.log('   - Rutelengde:', routeDistance + 'km');

    // Beregn total rekkevidde med startbatteri
    const totalRangeWithStartBattery = (batteryPercentage / 100) * car.range;
    console.log('   - Total rekkevidde med ' + batteryPercentage + '%:', totalRangeWithStartBattery.toFixed(1) + 'km');

    // Selv om batteriet holder hele veien, vil vi fortsatt vise alle stasjoner på ruten som røde
    if (totalRangeWithStartBattery >= routeDistance) {
      console.log('✅ BATTERIET HOLDER HELE VEIEN, men viser fortsatt stasjoner på ruten');
      // Ikke returner tom array - fortsett å finne stasjoner på ruten
    }

    console.log('🚨 TRENGER LADING! Rekkevidde mangler:', (routeDistance - totalRangeWithStartBattery).toFixed(1) + 'km');
    
    // Beregn hvor langt vi kan kjøre før kritisk nivå (10%)
    const distanceBeforeCritical = ((batteryPercentage - criticalBatteryLevel) / 100) * car.range;
    console.log('📍 Distanse før kritisk punkt (10%):', distanceBeforeCritical.toFixed(1) + 'km');

    // Finn stasjoner langs ruten - MEGET LIBERALT
    console.log('🔍 STARTER SØKING LANGS RUTEN...');
    const stationsAlongRoute = availableStations
      .map(station => {
        // Finn nærmeste punkt på ruten til stasjonen
        let minDistance = Infinity;
        let closestPointIndex = 0;
        let distanceAlongRoute = 0;

        for (let i = 0; i < routeCoordinates.length; i++) {
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

        // Beregn faktisk distanse langs ruten til nærmeste punkt
        for (let i = 0; i < closestPointIndex; i++) {
          if (i < routeCoordinates.length - 1) {
            distanceAlongRoute += getDistance(
              routeCoordinates[i][1],
              routeCoordinates[i][0],
              routeCoordinates[i + 1][1],
              routeCoordinates[i + 1][0]
            );
          }
        }
        
        console.log('🗺️', station.name + ': avstand fra rute =', minDistance.toFixed(1) + 'km, distanse langs ruten =', distanceAlongRoute.toFixed(1) + 'km');
        
        if (minDistance <= maxDetourDistance) {
          
          return {
            ...station,
            distanceFromRoute: minDistance,
            distanceAlongRoute: distanceAlongRoute
          };
        }
        return null;
      })
      .filter((station): station is ChargingStation & {
        distanceFromRoute: number;
        distanceAlongRoute: number;
      } => station !== null)
      .slice(0, maxStationsToShow);

    console.log('📍 Fant', stationsAlongRoute.length, 'stasjoner langs ruten (maks', maxStationsToShow + ', innen', maxDetourDistance + 'km)');

    const optimizedStations: ChargingStation[] = [];
    let currentBatteryLevel = batteryPercentage;
    let currentDistance = 0;

    console.log('🔍 Fant', stationsAlongRoute.length, 'stasjoner langs ruten totalt');

    // Sorter stasjoner etter distanse langs ruten
    stationsAlongRoute.sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute);

    // Finn stasjoner hvor vi kan lade når batteriet blir lavt (MEGET liberale kriterier)
    console.log('🔍 ANALYSERER ALLE', stationsAlongRoute.length, 'STASJONER LANGS RUTEN:');
    // VISER ALLE STASJONER UANSETT BATTERINIVÅ!
    console.log('🚨 VISER ALLE STASJONER - INGEN FILTRERING!');
    const stationsBeforeCritical = stationsAlongRoute.map(station => {
      const batteryAtStation = batteryPercentage - (station.distanceAlongRoute / car.range) * 100;
      
      console.log('🔍', station.name + ':', station.distanceAlongRoute.toFixed(1) + 'km, batteri ved ankomst:', batteryAtStation.toFixed(1) + '%');
      console.log('   - LEGGER TIL DENNE STASJONEN UANSETT BATTERINIVÅ!');
      
      return station;
    });

    console.log('📍 RESULTAT: Funnet', stationsBeforeCritical.length, 'ladestasjoner TOTALT (alle vist)');
    
    // Hvis ingen stasjoner funnet, vis alle for debugging
    if (stationsBeforeCritical.length === 0) {
      console.log('🚨 INGEN STASJONER FUNNET! Viser alle stasjoner for debugging:');
      stationsAlongRoute.forEach(station => {
        const batteryAtStation = batteryPercentage - (station.distanceAlongRoute / car.range) * 100;
        console.log('   📍', station.name + ':', batteryAtStation.toFixed(1) + '% batteri ved', station.distanceAlongRoute.toFixed(1) + 'km');
      });
    }

    // RETURNER ALLE STASJONER SOM LIGGER PÅ RUTEN (innen 3km) SOM RØDE MARKØRER
    console.log('🔴 RETURNERER ALLE', stationsAlongRoute.length, 'STASJONER PÅ RUTEN SOM RØDE MARKØRER!');
    
    const allStationsOnRoute = stationsAlongRoute.map((station, index) => {
      const arrivalBattery = batteryPercentage - (station.distanceAlongRoute / car.range) * 100;
      
      console.log('🔴 RØD STASJON PÅ RUTEN:', station.name, 'ved', station.distanceAlongRoute.toFixed(1) + 'km, avstand fra rute:', station.distanceFromRoute.toFixed(1) + 'km');
      
      return {
        ...station,
        arrivalBatteryPercentage: arrivalBattery,
        targetBatteryPercentage: 80,
        isRequired: false, // Ikke nødvendigvis påkrevd, men på ruten
        chargingTime: calculateChargingTime(arrivalBattery, 80, station.fastCharger)
      };
    });

    console.log('📊 RESULTAT: Returnerer', allStationsOnRoute.length, 'ladestasjoner som ligger på ruten');
    
    allStationsOnRoute.forEach((station, index) => {
      console.log('📍 Rød stasjon', (index + 1) + ':', station.name, 'på', station.distanceAlongRoute?.toFixed(1) + 'km fra start, avstand fra rute:', station.distanceFromRoute?.toFixed(1) + 'km');
    });

    console.log('🔍 RESULTAT fra optimizeChargingStations:', allStationsOnRoute.length, 'stasjoner');
    return allStationsOnRoute;
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

  // Effekt for manuell trigger fra "Planlegg rute" knappen
  useEffect(() => {
    if (routeTrigger && map.current && routeData.from && routeData.to && selectedCar && accessToken) {
      console.log('🚀 Manuell route trigger aktivert, oppdaterer kart...');
      const routeType = selectedRouteId || 'fastest';
      updateMapRoute(routeType);
    }
  }, [routeTrigger]);

  // Ny useEffect for å håndtere rutevalg
  useEffect(() => {
    console.log('🎯 selectedRouteId endret til:', selectedRouteId);
    if (selectedRouteId && map.current && routeData.from && routeData.to && selectedCar && accessToken && !loading) {
      console.log('🔄 Oppdaterer rute basert på rutevalg:', selectedRouteId);
      updateMapRoute(selectedRouteId);
    }
  }, [selectedRouteId, accessToken, routeData.from, routeData.to, selectedCar]);

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
                <p className="text-sm text-muted-foreground mt-2">
                  Du kan likevel velge å lade underveis for ekstra trygghet.
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