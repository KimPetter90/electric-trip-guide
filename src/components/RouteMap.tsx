import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Thermometer, Wind, Car, Battery, TrendingUp, Navigation } from "lucide-react";
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

// Utvidet database av ladestasjoner
const allChargingStations: ChargingStation[] = [
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

interface RouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel | null;
}

export default function RouteMap({ isVisible, routeData, selectedCar }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [activeTab, setActiveTab] = useState("analysis");
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

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
    const trailerImpact = routeData.trailerWeight / 1000 * 0.15; // 15% reduksjon per tonn
    const actualRange = maxRange * (1 - trailerImpact);
    const currentRange = (actualRange * currentBattery / 100);
    
    console.log('=== LADEBEREGNING ===');
    console.log('Nåværende batteri:', currentBattery + '%');
    console.log('Maks rekkevidde:', maxRange, 'km');
    console.log('Faktisk rekkevidde (etter henger):', actualRange, 'km'); 
    console.log('Nåværende rekkevidde:', currentRange, 'km');
    console.log('Rute-avstand:', routeDistance, 'km');

    // Finn stasjoner som ligger langs ruten
    const stationsNearRoute = findStationsNearRoute(routeGeometry);
    console.log('Stasjoner langs ruten:', stationsNearRoute.length);

    if (currentRange >= routeDistance) {
      console.log('✅ Ingen lading nødvendig - batteriet holder hele veien');
      return [];
    }

    console.log('⚠️ Trenger lading! Mangler:', (routeDistance - currentRange).toFixed(1), 'km');

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
      .filter(station => (station as any).routeDistance > 50) // Ikke for nær start (økt fra 30 til 50km)
      .filter(station => station.available > 0) // Bare tilgjengelige stasjoner
      .filter(station => station.fastCharger || station.chargeAmount >= 45) // Foretrekk hurtigladere eller stasjoner med god lading
      .sort((a, b) => {
        // Prioriter hurtigladere og tilgjengelighet
        const aScore = (a.fastCharger ? 100 : 0) + (a.available / a.total * 50) + (a.chargeAmount > 50 ? 20 : 0);
        const bScore = (b.fastCharger ? 100 : 0) + (b.available / b.total * 50) + (b.chargeAmount > 50 ? 20 : 0);
        if (Math.abs(aScore - bScore) > 10) {
          return bScore - aScore; // Høyere score først
        }
        return (a as any).routeDistance - (b as any).routeDistance; // Så nærmeste
      });

    console.log('Sorterte stasjoner:', sortedStations.map(s => `${s.name} (${((s as any).routeDistance).toFixed(1)}km fra rute-start, ${s.fastCharger ? 'Hurtig' : 'Vanlig'}, ${s.available}/${s.total} ledig, ${s.chargeAmount}kWh)`));

    while (remainingDistance > 0) {
      const rangeLeft = (actualRange * currentBattery_remaining / 100) * 0.75; // 25% sikkerhetsbuffer (mindre aggressiv)
      console.log(`Batterinivå: ${currentBattery_remaining.toFixed(1)}%, rekkevidde igjen: ${rangeLeft.toFixed(1)}km, avstand igjen: ${remainingDistance.toFixed(1)}km`);
      
      if (rangeLeft >= remainingDistance) {
        console.log('✅ Kan nå målet uten mer lading');
        break;
      }

      // Ikke foreslå lading hvis batteriet er over 50% og vi har mer enn 150km rekkevidde igjen
      if (currentBattery_remaining > 50 && rangeLeft > 150) {
        console.log(`⏭️ Hopper over lading - batteriet er fortsatt ${currentBattery_remaining.toFixed(1)}% med ${rangeLeft.toFixed(1)}km rekkevidde`);
        distanceCovered += Math.min(rangeLeft - 50, remainingDistance / 2); // Hopp fremover, men ikke for langt
        remainingDistance = routeDistance - distanceCovered;
        currentBattery_remaining = Math.max(20, currentBattery_remaining - 25); // Simuler batteribruk
        continue;
      }

      // Finn neste stasjon vi kan nå
      const reachableStations = sortedStations.filter(station => {
        const stationDistance = (station as any).routeDistance;
        return stationDistance > distanceCovered && 
               (stationDistance - distanceCovered) <= rangeLeft &&
               station.available > 0;
      });

      if (reachableStations.length === 0) {
        console.log('❌ Ingen reachable stasjoner funnet!');
        // Emergency: velg nærmeste stasjon
        if (sortedStations.length > 0) {
          const emergency = sortedStations[0];
          console.log('🚨 Nødløsning: bruker', emergency.name);
          const stationDistance = (emergency as any).routeDistance;
          const batteryUsed = ((stationDistance - distanceCovered) / actualRange) * 100;
          const arrivalBattery = Math.max(5, currentBattery_remaining - batteryUsed);
          
          requiredStations.push({
            ...emergency,
            distance: stationDistance,
            arrivalBattery,
            departureBattery: Math.min(80, arrivalBattery + emergency.chargeAmount), // Maksimalt 80%
            isRequired: true
          } as any);
        }
        break;
      }

      // Velg best stasjon
      const bestStation = reachableStations[0]; // Ta den første (nærmeste)
      const stationDistance = (bestStation as any).routeDistance;
      const batteryUsed = ((stationDistance - distanceCovered) / actualRange) * 100;
      const arrivalBattery = Math.max(5, currentBattery_remaining - batteryUsed);
      const departureBattery = Math.min(80, arrivalBattery + bestStation.chargeAmount); // Maksimalt 80%

      console.log(`📍 Velger stasjon: ${bestStation.name} på ${stationDistance.toFixed(1)}km`);
      console.log(`   Ankomst batteri: ${arrivalBattery.toFixed(1)}%`);
      console.log(`   Avgang batteri: ${departureBattery.toFixed(1)}% (maks 80%)`);
      console.log(`   Ladetid: ${bestStation.chargeTime} min for ${(departureBattery - arrivalBattery).toFixed(1)}% lading`);

      requiredStations.push({
        ...bestStation,
        distance: stationDistance,
        arrivalBattery,
        departureBattery,
        isRequired: true
      } as any);

      // Oppdater for neste iterasjon
      distanceCovered = stationDistance;
      currentBattery_remaining = departureBattery;
      remainingDistance = routeDistance - distanceCovered;
      
      // Sikkerhet: max 3 stasjoner
      if (requiredStations.length >= 3) break;
    }

    console.log('🏁 RESULTAT: Funnet', requiredStations.length, 'obligatoriske ladestasjoner');
    requiredStations.forEach((station, i) => {
      console.log(`${i+1}. ${station.name} - ${station.distance?.toFixed(1)}km`);
    });
    
    return requiredStations;
  };

  // Beregn reiseanalyse
  const calculateTripAnalysis = (distance: number, stations: ChargingStation[]): TripAnalysis => {
    const totalTime = distance / 80; // Antatt snittfart 80 km/t
    const chargingTime = stations.reduce((total, station) => total + station.chargeTime, 0) / 60;
    const totalCost = stations.reduce((total, station) => total + station.cost, 0);
    const co2Saved = distance * 0.12; // 120g CO2/km for bensinbil
    const efficiency = selectedCar ? (selectedCar.range / selectedCar.batteryCapacity) * 100 / distance : 85;
    
    return {
      totalDistance: distance,
      totalTime: totalTime + chargingTime,
      totalCost,
      chargingTime: chargingTime * 60,
      co2Saved,
      efficiency: Math.min(efficiency, 100),
      weather: getWeatherData()
    };
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
        
        console.log('Beregner analyse...');
        const analysis = calculateTripAnalysis(distance, optimizedStations);
        setRouteAnalysis(analysis);

        console.log('Legger til markører for', optimizedStations.length, 'ladestasjoner');
        
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
          
          newMarkers.push(marker);
        });

        setMarkers(newMarkers);
        
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

  // Effekt for rute-oppdatering
  useEffect(() => {
    console.log('RouteData endret:', routeData);
    console.log('SelectedCar:', selectedCar?.model);
    console.log('MapboxToken:', !!mapboxToken);
    console.log('Map ready:', !!map.current);
    
    if (map.current && routeData.from && routeData.to && selectedCar && mapboxToken) {
      console.log('🔄 Oppdaterer rute på grunn av endring i data...');
      updateMapRoute();
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
          className="w-full h-96 rounded-lg border-2 border-primary shadow-lg"
          style={{ 
            minHeight: '400px',
            maxHeight: '600px',
            position: 'relative',
            zIndex: 1
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="stations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ladestasjoner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {routeAnalysis && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Total tid</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.totalTime)}t</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Ladekostnad</p>
                    <p className="text-2xl font-bold">{Math.round(routeAnalysis.totalCost)} kr</p>
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
                            
                            <div className="bg-white p-3 rounded border">
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
  );
}