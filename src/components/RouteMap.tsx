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
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<TripAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<ChargingStation[]>([]);
  const [activeTab, setActiveTab] = useState("map");
  const [routeLine, setRouteLine] = useState<google.maps.Polyline | null>(null);

  // Simuler værdata (i en ekte app ville dette komme fra en vær-API)
  const getWeatherData = (): WeatherData => ({
    temperature: Math.round(Math.random() * 20 - 5), // -5 til 15°C
    wind: Math.round(Math.random() * 15), // 0-15 m/s
    condition: ["Overskyet", "Sol", "Regn", "Snø"][Math.floor(Math.random() * 4)],
    impactOnRange: Math.round((Math.random() - 0.5) * 20) // ±10% påvirkning
  });

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

  // Intelligent ladestasjonsoptimalisering
  const optimizeChargingStations = (routeDistance: number) => {
    if (!selectedCar) return [];

    const weather = getWeatherData();
    const trailerImpact = routeData.trailerWeight > 0 ? 15 : 0;
    const weatherImpact = weather.impactOnRange;
    const totalImpact = trailerImpact + weatherImpact;
    
    // Beregn hvor langt vi kan kjøre med nåværende batteri
    const maxRangeWithFullBattery = selectedCar.range * (1 - totalImpact / 100);
    const currentBatteryRange = maxRangeWithFullBattery * (routeData.batteryPercentage / 100);
    const safetyMargin = 50; // 50km sikkerhet
    let usableCurrentRange = Math.max(0, currentBatteryRange - safetyMargin);
    
    // Sjekk om vi trenger lading i det hele tatt
    if (usableCurrentRange >= routeDistance) {
      return []; // Ingen lading nødvendig!
    }

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
    const maxDistancePerCharge = maxRangeWithFullBattery * 0.8; // Bruker 80% av full rekkevidde mellom ladinger
    
    // Første stopp basert på nåværende batteri
    while (currentDistance + usableCurrentRange < routeDistance) {
      const nextStopDistance = currentDistance + usableCurrentRange;
      
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
        
        // Neste stopp bruker full rekkevidde (siden vi lader til 80%+)
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

  // Cleanup function med safeguards
  const cleanupMap = () => {
    try {
      // Fjern alle markører med null-checks
      markers.forEach(marker => {
        if (marker && marker.setMap && typeof marker.setMap === 'function') {
          try {
            marker.setMap(null);
          } catch (e) {
            console.warn('Kunne ikke fjerne marker:', e);
          }
        }
      });
      setMarkers([]);
      
      // Fjern route line med null-check
      if (routeLine && routeLine.setMap && typeof routeLine.setMap === 'function') {
        try {
          routeLine.setMap(null);
        } catch (e) {
          console.warn('Kunne ikke fjerne route line:', e);
        }
      }
      setRouteLine(null);
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  };

  // Cleanup når komponenten unmountes
  useEffect(() => {
    return () => {
      // Delayed cleanup for å unngå DOM race conditions
      setTimeout(() => {
        cleanupMap();
      }, 0);
    };
  }, [markers, routeLine]);

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

        setMap(mapInstance);
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
    if (!map || !routeData.from || !routeData.to || !selectedCar) {
      return;
    }

    // Sjekk at map-referansen fortsatt er gyldig
    if (!mapRef.current) {
      console.warn('Map ref er null, avbryter rute-oppdatering');
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

    // Cleanup previous map elements (med ekstra sjekk)
    if (map && mapRef.current) {
      cleanupMap();
    }

    // Tegn rett linje mellom byene
    const drawRoute = () => {
      // Sjekk at komponenten fortsatt er mountet
      if (!mapRef.current || !map) {
        return { distance: 0, optimizedStations: [] };
      }
      
      const routePath = new google.maps.Polyline({
        path: [fromCoords, toCoords],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 8,
      });
      
      // Sjekk igjen før vi setter på kartet
      if (map && mapRef.current) {
        routePath.setMap(map);
        setRouteLine(routePath);
      }
      
      // Beregn distance
      const distance = getDistance(fromCoords, toCoords);
      
      // Optimaliser ladestasjoner basert på rett-linje distanse
      const optimizedStations = optimizeChargingStations(distance);
      setOptimizedStations(optimizedStations);
      
      // Beregn reiseanalyse
      const analysis = calculateTripAnalysis(distance, optimizedStations);
      setRouteAnalysis(analysis);
      
      return { distance, optimizedStations };
    };

    console.log('Tegner rute mellom', fromCity, 'og', toCity);
    const { distance, optimizedStations } = drawRoute();

    const newMarkers: google.maps.Marker[] = [];

    // Start markør
    const startMarker = new google.maps.Marker({
      position: fromCoords,
      map: map,
      title: `Start: ${routeData.from} (${routeData.batteryPercentage}% batteri)`,
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

    const startInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${routeData.from}</h3>
          <p style="margin: 5px 0; color: #374151;"><strong>Startbatteri:</strong> ${routeData.batteryPercentage}%</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Rekkevidde:</strong> ~${selectedCar ? Math.round(selectedCar.range * routeData.batteryPercentage / 100) : 0} km</p>
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
          <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="25" r="22" fill="#ef4444" stroke="white" stroke-width="6"/>
            <text x="25" y="32" text-anchor="middle" fill="white" font-size="24" font-weight="bold">🏁</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(50, 50),
        anchor: new google.maps.Point(25, 25)
      }
    });

    const endInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${routeData.to}</h3>
          <p style="margin: 5px 0; color: #374151;"><strong>Total distanse:</strong> ${Math.round(distance)} km</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Ladestopp:</strong> ${optimizedStations.length}</p>
        </div>
      `
    });

    endMarker.addListener('click', () => {
      endInfoWindow.open(map, endMarker);
    });

    newMarkers.push(endMarker);

    // Ladestasjoner på ruten
    optimizedStations.forEach((station, index) => {
      const availabilityColor = station.available / station.total > 0.5 ? '#10b981' : 
                               station.available > 0 ? '#f59e0b' : '#ef4444';
      
      const chargingMarker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: map,
        title: `Ladestopp ${index + 1}: ${station.name}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
              <circle cx="22.5" cy="22.5" r="20" fill="${availabilityColor}" stroke="white" stroke-width="4"/>
              <text x="22.5" y="18" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${index + 1}</text>
              <text x="22.5" y="30" text-anchor="middle" fill="white" font-size="12" font-weight="bold">⚡</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(45, 45),
          anchor: new google.maps.Point(22.5, 22.5)
        }
      });

      const chargingInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; min-width: 250px;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${station.name}</h3>
            <p style="margin: 5px 0; color: #374151;"><strong>Lokasjon:</strong> ${station.location}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Avstand:</strong> ${Math.round(station.distance || 0)} km fra start</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Ankomst batteri:</strong> ${Math.round(station.arrivalBattery || 0)}%</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Avreise batteri:</strong> ${Math.round(station.departureBattery || 0)}%</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Ladetid:</strong> ${station.chargeTime} min</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Kostnad:</strong> ${station.cost} kr</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Tilgjengelig:</strong> ${station.available}/${station.total}</p>
            <div style="margin-top: 10px;">
              <span style="padding: 2px 8px; background: ${availabilityColor}; color: white; border-radius: 12px; font-size: 12px;">
                ${station.fastCharger ? 'Hurtiglader' : 'Standard'}
              </span>
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
    
    // Justerer kameraet for å vise hele ruten (med safeguard)
    if (map && mapRef.current && fromCoords && toCoords) {
      try {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(fromCoords);
        bounds.extend(toCoords);
        optimizedStations.forEach(station => {
          bounds.extend({ lat: station.lat, lng: station.lng });
        });
        map.fitBounds(bounds);
      } catch (error) {
        console.warn('Kunne ikke sette bounds:', error);
      }
    }
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