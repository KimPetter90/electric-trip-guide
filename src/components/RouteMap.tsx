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

  // Intelligent ladestasjonsoptimalisering
  const optimizeChargingStations = (routeDistance: number) => {
    if (!selectedCar) return [];

    const currentRange = (selectedCar.range * routeData.batteryPercentage / 100);
    const rangeWithTrailer = currentRange * (1 - routeData.trailerWeight / 1000 * 0.1);
    
    if (rangeWithTrailer >= routeDistance) {
      return [];
    }

    const fromCity = routeData.from.toLowerCase().trim();
    const toCity = routeData.to.toLowerCase().trim();
    const fromCoords = cityCoordinates[fromCity];
    const toCoords = cityCoordinates[toCity];

    if (!fromCoords || !toCoords) return [];

    const stationsWithDistance = allChargingStations.map(station => {
      const distanceFromStart = getDistance(fromCoords, { lat: station.lat, lng: station.lng });
      const distanceToEnd = getDistance({ lat: station.lat, lng: station.lng }, toCoords);
      return {
        ...station,
        distance: distanceFromStart,
        totalRouteDistance: distanceFromStart + distanceToEnd
      };
    });

    const suitableStations = stationsWithDistance
      .filter(station => station.distance > 50 && station.distance < routeDistance - 50)
      .sort((a, b) => {
        const scoreA = (a.fastCharger ? 2 : 1) * a.available / a.total - a.cost / 1000;
        const scoreB = (b.fastCharger ? 2 : 1) * b.available / b.total - b.cost / 1000;
        return scoreB - scoreA;
      })
      .slice(0, 3);

    return suitableStations.map((station, index) => ({
      ...station,
      arrivalBattery: Math.max(10, routeData.batteryPercentage - (station.distance / selectedCar.range * 100)),
      departureBattery: Math.min(90, (routeData.batteryPercentage - (station.distance / selectedCar.range * 100)) + station.chargeAmount)
    }));
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
      const response = await fetch('https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/mapbox-token', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTQ0MDgsImV4cCI6MjA3MzM3MDQwOH0.KdDS_tT7LV7HuXN8Nw3dxUU3YRGobsJrkE2esDxgJH8'}`
        }
      });
      
      const data = await response.json();
      
      if (data.token) {
        setMapboxToken(data.token);
        return data.token;
      } else {
        throw new Error(data.error || 'Kunne ikke hente Mapbox token');
      }
    } catch (error) {
      console.error('Feil ved henting av Mapbox token:', error);
      setError('Kunne ikke hente kart-token. Sjekk at Mapbox token er konfigurert i Supabase secrets.');
      return null;
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
        const optimizedStations = optimizeChargingStations(distance);
        setOptimizedStations(optimizedStations);
        
        console.log('Beregner analyse...');
        const analysis = calculateTripAnalysis(distance, optimizedStations);
        setRouteAnalysis(analysis);

        // Legg til ladestasjonsmarkører
        optimizedStations.forEach((station, index) => {
          const el = document.createElement('div');
          el.className = 'charging-marker';
          el.style.backgroundColor = station.available / station.total > 0.5 ? '#10b981' : 
                                    station.available > 0 ? '#f59e0b' : '#ef4444';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.color = 'white';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '14px';
          el.style.fontWeight = 'bold';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          el.textContent = (index + 1).toString();

          const marker = new mapboxgl.Marker(el)
            .setLngLat([station.lng, station.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <h4 class="font-semibold">${station.name}</h4>
                <p class="text-sm">${station.location}</p>
                <p class="text-xs">Tilgjengelig: ${station.available}/${station.total}</p>
                <p class="text-xs">Lading: ${station.chargeAmount} kWh (${station.chargeTime} min)</p>
                <p class="text-xs">Kostnad: ${station.cost} kr</p>
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
    if (map.current && routeData.from && routeData.to && selectedCar && mapboxToken) {
      updateMapRoute();
    }
  }, [map.current, routeData, selectedCar, mapboxToken]);

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