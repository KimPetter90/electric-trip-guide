import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Navigation, Zap, Battery, Play, Pause, LocateFixed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  available: number;
  total: number;
  fastCharger: boolean;
  chargeTime: number;
  chargeAmount: number;
  cost: number;
}

interface SimpleRouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel;
}

// Enkle mock ladestasjoner
const basicChargingStations: ChargingStation[] = [
  { id: '1', name: 'Tesla Supercharger Fosnavåg', location: 'Fosnavåg', lat: 62.3157, lng: 5.7361, available: 8, total: 12, fastCharger: true, chargeTime: 45, chargeAmount: 56, cost: 780 },
  { id: '2', name: 'Circle K Ålesund', location: 'Ålesund', lat: 62.4722, lng: 6.1495, available: 3, total: 6, fastCharger: true, chargeTime: 35, chargeAmount: 45, cost: 650 },
  { id: '3', name: 'Eviny Stryn', location: 'Stryn', lat: 61.9118, lng: 6.7131, available: 2, total: 4, fastCharger: false, chargeTime: 60, chargeAmount: 35, cost: 490 },
  { id: '4', name: 'Tesla Supercharger Lillehammer', location: 'Lillehammer', lat: 61.1153, lng: 10.4662, available: 6, total: 8, fastCharger: true, chargeTime: 40, chargeAmount: 52, cost: 720 },
  { id: '5', name: 'Circle K Drammen', location: 'Drammen', lat: 59.7439, lng: 10.2045, available: 4, total: 6, fastCharger: true, chargeTime: 30, chargeAmount: 48, cost: 680 },
  { id: '6', name: 'Tesla Supercharger Arendal', location: 'Arendal', lat: 58.4616, lng: 8.7722, available: 5, total: 10, fastCharger: true, chargeTime: 45, chargeAmount: 55, cost: 770 }
];

export default function SimpleRouteMap({ isVisible, routeData, selectedCar }: SimpleRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criticalStation, setCriticalStation] = useState<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isGPSActive, setIsGPSActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-token');
      if (error) throw error;
      return data.token;
    } catch (error) {
      console.error('Feil ved henting av Mapbox token:', error);
      return null;
    }
  };

  const getCoordinatesForPlace = async (place: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}, Norge.json?country=NO&types=place,locality,district,region&access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Feil ved henting av koordinater:', error);
      return null;
    }
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findCriticalChargingStation = async () => {
    console.log('🔍 Finner første kritiske ladestasjon...');
    
    if (!selectedCar || !routeData.from || !routeData.to) {
      console.log('❌ Mangler data for beregning');
      return;
    }

    // Hent koordinater
    const fromCoords = await getCoordinatesForPlace(routeData.from);
    const toCoords = await getCoordinatesForPlace(routeData.to);
    
    if (!fromCoords || !toCoords) {
      console.log('❌ Kunne ikke finne koordinater');
      setError('Kunne ikke finne koordinater for start eller destinasjon');
      return;
    }

    // Beregn grunnleggende rekkevidde
    const currentBattery = routeData.batteryPercentage;
    const maxRange = selectedCar.range;
    const actualRange = maxRange * 0.9; // 10% buffer for reelle forhold
    const currentRange = (currentBattery / 100) * actualRange;
    
    // Beregn når batteriet når 10%
    const rangeAt10Percent = actualRange * 0.1;
    const usableRangeBeforeCritical = currentRange - rangeAt10Percent;
    
    console.log('🔋 Startbatteri:', currentBattery + '%');
    console.log('🚗 Faktisk rekkevidde:', actualRange.toFixed(1), 'km');
    console.log('📏 Rekkevidde før batteriet når 10%:', usableRangeBeforeCritical.toFixed(1), 'km');

    // Hvis vi kan kjøre hele ruten uten å nå 10%
    if (usableRangeBeforeCritical >= calculateDistance(fromCoords, toCoords)) {
      console.log('✅ Batteriet holder hele ruten - ingen kritisk ladestasjon nødvendig');
      setCriticalStation(null);
      return;
    }

    // Finn nærmeste tilgjengelige stasjon innen kritisk rekkevidde
    const availableStations = basicChargingStations.filter(station => station.available > 0);
    let bestStation = null;
    let shortestDistance = Infinity;

    for (const station of availableStations) {
      const distanceFromStart = calculateDistance(fromCoords, { lat: station.lat, lng: station.lng });
      
      if (distanceFromStart <= usableRangeBeforeCritical && distanceFromStart < shortestDistance) {
        bestStation = station;
        shortestDistance = distanceFromStart;
      }
    }

    if (bestStation) {
      const arrivalBattery = Math.max(5, currentBattery - (shortestDistance / actualRange) * 100);
      
      console.log(`🚨 KRITISK LADESTASJON FUNNET: ${bestStation.name}`);
      console.log(`📍 Avstand: ${shortestDistance.toFixed(1)} km`);
      console.log(`🔋 Batterinivå ved ankomst: ${arrivalBattery.toFixed(1)}%`);
      
      setCriticalStation({
        ...bestStation,
        distance: shortestDistance,
        arrivalBattery
      });
    } else {
      console.log('❌ Ingen tilgjengelig ladestasjon funnet innen kritisk rekkevidde');
      setError('Ingen tilgjengelig ladestasjon funnet. Du må lade hjemme først.');
    }
  };

  const checkGPSPermission = async () => {
    if (!navigator.geolocation) {
      setGpsPermission('denied');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setGpsPermission(permission.state);
    } catch (error) {
      console.error('Kunne ikke sjekke GPS-tillatelse:', error);
      setGpsPermission('prompt');
    }
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      toast.error('GPS er ikke tilgjengelig på denne enheten');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lng: longitude };
      
      setCurrentLocation(newLocation);
      updateUserLocationOnMap(newLocation);
      
      if (!isGPSActive) {
        setIsGPSActive(true);
        toast.success('GPS-sporing aktivert');
      }
    };

    const error = (error: GeolocationPositionError) => {
      console.error('GPS-feil:', error);
      let errorMessage = 'Kunne ikke få GPS-posisjon';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'GPS-tilgang nektet. Aktiver stedstjenester i nettleseren.';
          setGpsPermission('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'GPS-posisjon ikke tilgjengelig';
          break;
        case error.TIMEOUT:
          errorMessage = 'GPS-forespørsel tidsavbrudd';
          break;
      }
      
      toast.error(errorMessage);
      setIsGPSActive(false);
    };

    watchId.current = navigator.geolocation.watchPosition(success, error, options);
  };

  const stopGPSTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
      userLocationMarker.current = null;
    }
    
    setIsGPSActive(false);
    setCurrentLocation(null);
    toast.info('GPS-sporing stoppet');
  };

  const updateUserLocationOnMap = (location: { lat: number; lng: number }) => {
    if (!map.current) return;

    // Opprett eller oppdater brukerens posisjon-markør
    if (userLocationMarker.current) {
      userLocationMarker.current.setLngLat([location.lng, location.lat]);
    } else {
      // Lag en custom GPS-markør
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '3px solid #ffffff';
      el.style.borderRadius = '50%';
      el.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.8)';
      el.style.animation = 'pulse 2s infinite';

      userLocationMarker.current = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h4 class="font-bold text-blue-600">📍 Din posisjon</h4>
            <p class="text-sm">Lat: ${location.lat.toFixed(6)}</p>
            <p class="text-sm">Lng: ${location.lng.toFixed(6)}</p>
          </div>
        `))
        .addTo(map.current);
    }

    // Sentrer kartet på brukerens posisjon i GPS-modus
    if (isGPSActive) {
      map.current.easeTo({
        center: [location.lng, location.lat],
        zoom: Math.max(map.current.getZoom(), 14),
        duration: 1000
      });
    }
  };

  const initializeMap = async () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [8.0, 60.0],
        zoom: 5
      });

      map.current.on('load', () => {
        setLoading(false);
        updateMapRoute();
      });

    } catch (error) {
      console.error('Feil ved initialisering av kart:', error);
      setError('Kunne ikke laste kartet');
      setLoading(false);
    }
  };

  const updateMapRoute = async () => {
    if (!map.current || !routeData.from || !routeData.to) return;

    try {
      setError(null);
      
      const fromCoords = await getCoordinatesForPlace(routeData.from);
      const toCoords = await getCoordinatesForPlace(routeData.to);
      
      if (!fromCoords || !toCoords) {
        setError('Kunne ikke finne koordinater');
        return;
      }

      // Legg til start og slutt markører
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([fromCoords.lng, fromCoords.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h4>Start: ${routeData.from}</h4>`))
        .addTo(map.current!);
      
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([toCoords.lng, toCoords.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h4>Mål: ${routeData.to}</h4>`))
        .addTo(map.current!);

      // Legg til kritisk ladestasjon hvis funnet
      if (criticalStation) {
        const el = document.createElement('div');
        el.style.backgroundColor = '#dc2626';
        el.style.border = '4px solid #ffffff';
        el.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.8)';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.color = 'white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '18px';
        el.style.fontWeight = 'bold';
        el.textContent = '!';

        new mapboxgl.Marker(el)
          .setLngLat([criticalStation.lng, criticalStation.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-3">
              <h4 class="font-bold text-red-600">⚠️ KRITISK LADESTASJON</h4>
              <p><strong>${criticalStation.name}</strong></p>
              <p>Avstand: ${criticalStation.distance.toFixed(1)} km</p>
              <p>Batterinivå ved ankomst: ${criticalStation.arrivalBattery.toFixed(1)}%</p>
              <p class="text-red-600 text-sm mt-2">Du MÅ lade her!</p>
            </div>
          `))
          .addTo(map.current!);
      }

      // Tilpass visning
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([fromCoords.lng, fromCoords.lat]);
      bounds.extend([toCoords.lng, toCoords.lat]);
      if (criticalStation) {
        bounds.extend([criticalStation.lng, criticalStation.lat]);
      }
      
      map.current!.fitBounds(bounds, { padding: 50 });

    } catch (error) {
      console.error('Feil ved rute-oppdatering:', error);
      setError('Kunne ikke oppdatere ruten');
    }
  };

  useEffect(() => {
    if (isVisible) {
      const init = async () => {
        const token = await fetchMapboxToken();
        if (token) {
          setMapboxToken(token);
        } else {
          setError('Kunne ikke laste Mapbox token');
          setLoading(false);
        }
      };
      init();
      checkGPSPermission();
    }
  }, [isVisible]);

  // Cleanup GPS når komponenten unmountes
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mapboxToken) {
      initializeMap();
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (routeData.from && routeData.to && selectedCar) {
      findCriticalChargingStation();
    }
  }, [routeData.from, routeData.to, routeData.batteryPercentage, selectedCar?.id]);

  useEffect(() => {
    if (map.current) {
      updateMapRoute();
    }
  }, [criticalStation]);

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary animate-glow-pulse" />
          <h3 className="text-lg font-semibold text-foreground">Kartvisning</h3>
          <Badge variant="secondary" className="ml-2">
            {basicChargingStations.length} ladestasjoner
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {currentLocation && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <LocateFixed className="h-3 w-3 mr-1" />
              GPS aktiv
            </Badge>
          )}
          
          <Button
            onClick={isGPSActive ? stopGPSTracking : startGPSTracking}
            variant={isGPSActive ? "destructive" : "default"}
            size="sm"
            disabled={gpsPermission === 'denied'}
            className="min-w-[120px]"
          >
            {isGPSActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stopp reise
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start reise
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border border-border shadow-lg bg-card"
        />
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-sm">Laster kart...</div>
            </div>
          </div>
        )}
      </div>

      {criticalStation && (
        <Card className="p-4 border-red-500 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-600">OBLIGATORISK LADESTASJON</h4>
          </div>
          <div className="space-y-2">
            <p className="font-medium">{criticalStation.name}</p>
            <p className="text-sm text-muted-foreground">{criticalStation.location}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Avstand:</strong> {criticalStation.distance.toFixed(1)} km</p>
                <p><strong>Batterinivå ved ankomst:</strong> <span className="text-red-600 font-bold">{criticalStation.arrivalBattery.toFixed(1)}%</span></p>
              </div>
              <div>
                <p><strong>Ladetid:</strong> {criticalStation.chargeTime} min</p>
                <p><strong>Tilgjengelig:</strong> {criticalStation.available}/{criticalStation.total}</p>
              </div>
            </div>
            <Badge variant="destructive" className="mt-2">
              {criticalStation.fastCharger ? "⚡ Hurtiglader" : "Standard lader"}
            </Badge>
            <p className="text-xs text-red-600 mt-2 font-medium">
              ⚠️ Du MÅ lade her - batteriet når 10% før dette punktet
            </p>
          </div>
        </Card>
      )}

      {!criticalStation && !error && !loading && (
        <Card className="p-4 border-green-500 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-600">Ingen kritisk lading nødvendig</h4>
          </div>
          <p className="text-sm text-green-700">
            Batteriet holder hele ruten uten at det når kritisk nivå (10%).
          </p>
        </Card>
      )}
    </div>
  );
}